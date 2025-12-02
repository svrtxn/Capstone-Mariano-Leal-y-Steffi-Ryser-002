// services/monitoreoGlucosaService.js
const { LibreLinkClient } = require('libre-link-unofficial-api');
const UsuarioModel = require('../models/usuarioModel');
const GlucosaModel = require('../models/glucosaModel');
const ConfigModel = require('../models/configModel');
const AlertasModel = require('../models/alertasModel');
const clasificarAlerta = require('../utils/clasificarAlerta');
const firebaseDB = require('../config/firebaseAdmin');
const ContactosModel = require('../models/contactosApoyoModel'); // 👈 para notificar contactos
const pushService = require('../services/pushService');           // 👈 para enviar push

async function guardarLecturaSensor(lectura, usuarioId) {
  try {
    const valor_glucosa = Number(lectura.value);
    const fecha_registro = new Date(lectura.timestamp || Date.now());

    //  Guardar en MySQL
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
    row.id = insertId;

    // generacion alerta sensor
    let resultadoAlerta = { tipo: "sin_config" };

    const configUsuario = await ConfigModel.obtenerPorUsuario(usuarioId);
    const usuarioInfo = await UsuarioModel.obtenerPorId(usuarioId);

    if (configUsuario && configUsuario.notificaciones === 1) {
      resultadoAlerta = clasificarAlerta(valor_glucosa, configUsuario);
      console.log("Tipo alerta:", resultadoAlerta.tipo);

      const mensajesPorTipo = {
        roja_hipo: {
          titulo: "🚨 Emergencia: Hipoglucemia severa",
          detalle: `Nivel crítico: ${valor_glucosa} mg/dL (bajo peligroso)`
        },
        roja_hiper: {
          titulo: "🚨 Emergencia: Hiperglucemia severa",
          detalle: `Nivel crítico: ${valor_glucosa} mg/dL (alto peligroso)`
        },
        amarilla_baja: {
          titulo: "⚠️ Precaución: Glucosa baja",
          detalle: `Valor bajo detectado: ${valor_glucosa} mg/dL`
        },
        amarilla_alta: {
          titulo: "⚠️ Precaución: Glucosa alta",
          detalle: `Valor elevado detectado: ${valor_glucosa} mg/dL`
        },
        verde: {
          titulo: "✅ Glucosa en rango",
          detalle: `Valor normal: ${valor_glucosa} mg/dL`
        },
        sin_config: {
          titulo: "ℹ️ Lectura registrada",
          detalle: `Glucosa detectada: ${valor_glucosa} mg/dL`
        }
      };

      const msg = mensajesPorTipo[resultadoAlerta.tipo] || mensajesPorTipo.sin_config;

      if (resultadoAlerta.tipo !== "verde") {
        const alertaId = await AlertasModel.crear({
          usuario_id: usuarioId,
          tipo_alerta: resultadoAlerta.tipo,
          valor_disparador: valor_glucosa,
          comparador: resultadoAlerta.comparador,
          estado: "activa",
          canal: "push",
          prioridad: resultadoAlerta.prioridad,
          titulo: msg.titulo,
          mensaje: msg.detalle
        });

        // Notificación al paciente
        await pushService.enviarNotificacion(
          usuarioId,
          msg.titulo,
          msg.detalle,
          alertaId
        );

        // notificación a contactos de apoyo
        const contactos = await ContactosModel.obtenerContactosAceptados(usuarioId);

        if (contactos.length > 0) {
          await pushService.enviarNotificacionMultiple(
            contactos,
            `Alerta de ${usuarioInfo?.nombre || "el usuario"}`,
            msg.detalle,
            alertaId
          );
        }
      }
    }

    // guardar firebase
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
