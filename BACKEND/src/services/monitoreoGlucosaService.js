// services/monitoreoGlucosaService.js
const { LibreLinkClient } = require('libre-link-unofficial-api');
const UsuarioModel = require('../models/usuarioModel');
const GlucosaModel = require('../models/glucosaModel');
const ConfigModel = require('../models/configModel');
const AlertasModel = require('../models/alertasModel');
const clasificarAlerta = require('../utils/clasificarAlerta');
const firebaseDB = require('../config/firebaseAdmin');

/**
 * Guarda la lectura del sensor en MySQL, genera alerta y guarda en Firebase.
 */
async function guardarLecturaSensor(lectura, usuarioId) {
  try {
    const valor_glucosa = Number(lectura.value);
    const fecha_registro = new Date(lectura.timestamp || Date.now());

    // 1️⃣ Guardar en MySQL
    const insertId = await GlucosaModel.crear({
      usuario_id: usuarioId,
      valor_glucosa,
      unidad: 'mg/dL',
      metodo_registro: 'sensor',
      origen_sensor: lectura.sensor_id || null,
      fecha_registro,
      etiquetado: null,
      notas: null,
      registrado_por: null
    });

    const row = await GlucosaModel.obtenerPorId(insertId);
    if (!row) throw new Error("No se pudo recuperar la lectura insertada");

    row.fecha_registro = fecha_registro.toISOString();

    // =========================================
    // 🚨 GENERACIÓN DE ALERTAS PARA SENSOR
    // =========================================
    let resultadoAlerta = { tipo: "sin_config" };

    const configUsuario = await ConfigModel.obtenerPorUsuario(usuarioId);

    if (configUsuario && configUsuario.notificaciones === 1) {
      resultadoAlerta = clasificarAlerta(valor_glucosa, configUsuario);
      console.log("Tipo alerta:", resultadoAlerta.tipo);

      if (resultadoAlerta.tipo !== "verde") {
        const alertaId = await AlertasModel.crear({
          usuario_id: usuarioId,
          tipo_alerta: resultadoAlerta.tipo,
          valor_disparador: valor_glucosa,
          comparador: resultadoAlerta.comparador,
          estado: "activa",
          canal: "push",
          prioridad: resultadoAlerta.prioridad,
          titulo: `Alerta ${resultadoAlerta.tipo.toUpperCase()}`,
          mensaje: `Glucosa detectada: ${valor_glucosa} mg/dL`
        });

        // Enviar push
        await pushService.enviarNotificacion(
          usuario_id,
          `Alerta ${resultadoAlerta.tipo.toUpperCase()}`,
          `Glucosa: ${valor_glucosa} mg/dL`,
          alertaId
        );

        const contactos = await ContactosModel.obtenerContactosAceptados(usuario_id);

        if (contactos.length > 0) {
          await pushService.enviarNotificacionMultiple(
            contactos,
            `Alerta del usuario ${usuario_id}`,
            `Se detectó un nivel de glucosa: ${valor_glucosa} mg/dL`,
            alertaId
          );
        }


      }
    }

    // =========================================
    // 🔥 GUARDAR EN FIREBASE
    // =========================================
    const ref = firebaseDB.db.ref(`niveles_glucosa/${usuarioId}`).push();
    await ref.set(row);

    console.log("🚀 ALERTA GENERADA (sensor):", resultadoAlerta);

    return {
      ...row,
      alerta: resultadoAlerta.tipo
    };

  } catch (error) {
    console.error("❌ ERROR EN guardarLecturaSensor:", error);
    throw error;
  }
}

/**
 * 🔁 Hace UNA sola lectura desde LibreLink para un usuario
 * y la guarda en MySQL + Firebase usando guardarLecturaSensor.
 */
async function leerYGuardarUnaVez(usuarioId) {
  console.log(`⚙️ leerYGuardarUnaVez → usuarioId=${usuarioId}`);

  const usuario = await UsuarioModel.obtenerCredenciales(usuarioId);
  if (!usuario) {
    console.error(`Usuario con ID ${usuarioId} no encontrado`);
    throw new Error('Usuario no encontrado');
  }

  if (usuario.tiene_sensor !== 1 || !usuario.contrasena_librelink) {
    console.log(
      `Usuario ${usuarioId} no tiene sensor activo o no tiene contraseña LibreLink.`
    );
    throw new Error('Usuario no tiene sensor LibreLink configurado');
  }

  try {
    const client = new LibreLinkClient({
      email: usuario.email || usuario.correo,
      password: usuario.contrasena_librelink,
      region: 'US',
      language: 'es-ES',
      lluVersion: '4.16.0'
    });

    await client.login();
    const lecturaLibre = await client.read();

    if (!lecturaLibre) {
      console.log(`⚠️ No se obtuvo lectura para usuario ${usuarioId}`);
      throw new Error('No se obtuvo lectura del sensor');
    }

    const resultado = await guardarLecturaSensor(lecturaLibre, usuarioId);
    console.log(
      `✅ Lectura registrada (leerYGuardarUnaVez) para usuario ${usuarioId}:`,
      resultado.valor_glucosa,
      'mg/dL'
    );

    return resultado;
  } catch (err) {
    console.error(
      `❌ Error al obtener lectura del usuario ${usuarioId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * 🔥 "Iniciar monitoreo" = hacer UNA lectura como la de login.
 * El intervalo lo manejamos en el FRONT, no en el backend.
 */
async function iniciarMonitoreoUsuario(usuarioId, intervaloMs) {
  try {
    const lectura = await leerYGuardarUnaVez(usuarioId);
    return {
      ok: true,
      mensaje: 'Lectura de sensor realizada',
      lectura,
    };
  } catch (error) {
    return {
      ok: false,
      mensaje: error.message || 'No se pudo leer el sensor',
    };
  }
}

/**
 * Detener monitoreo:
 * Como ya no usamos setInterval en el backend, esto es básicamente informativo.
 */
function detenerMonitoreoUsuario(usuarioId) {
  console.log(
    `ℹ️ detenerMonitoreoUsuario llamado, pero no hay intervalos en backend. usuarioId=${usuarioId}`
  );
  return {
    ok: true,
    mensaje: 'No hay monitoreo programado en el servidor',
    usuarioId,
  };
}

/**
 * Obtiene la última lectura del usuario desde Firebase.
 */
async function obtenerUltimaLectura(usuarioId) {
  const ref = firebaseDB.db.ref(`niveles_glucosa/${usuarioId}`);
  const snapshot = await ref.orderByKey().limitToLast(1).get();
  if (!snapshot.exists()) return null;
  const lecturas = snapshot.val();
  return Object.values(lecturas)[0];
}

module.exports = {
  iniciarMonitoreoUsuario,
  detenerMonitoreoUsuario,
  obtenerUltimaLectura,
  guardarLecturaSensor,
  leerYGuardarUnaVez,
};
