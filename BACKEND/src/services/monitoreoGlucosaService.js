const { LibreLinkClient } = require('libre-link-unofficial-api');
const UsuarioModel = require('../models/usuarioModel');
const GlucosaModel = require('../models/glucosaModel');
const ConfigModel = require('../models/configModel');
const AlertasModel = require('../models/alertasModel');
const clasificarAlerta = require('../utils/clasificarAlerta');
const firebaseDB = require('../config/firebaseAdmin');

const monitoreosActivos = new Map();

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
      console.log(resultadoAlerta.tipo);

      if (resultadoAlerta.tipo !== "verde") {
        await AlertasModel.crear({
          usuario_id: usuarioId,
          tipo_alerta: resultadoAlerta.tipo,
          valor_disparador: valor_glucosa,
          comparador: resultadoAlerta.comparador,
          estado: "pendiente",
          canal: "push",
          prioridad: resultadoAlerta.prioridad
        });
      }
    }

    // =========================================
    // 🔥 GUARDAR EN FIREBASE
    // =========================================
    const ref = firebaseDB.db.ref(`niveles_glucosa/${usuarioId}`).push();
    await ref.set(row);

    console.log("🚀 ALERTA GENERADA (sensor):", resultadoAlerta);

    // Esta función NO responde HTTP → retornamos datos al que llama
    return {
      ...row,
      alerta: resultadoAlerta.tipo
    };

  } catch (error) {
    console.error("❌ ERROR EN guardarLecturaSensor:", error);
    throw error; // Se maneja en iniciarMonitoreoUsuario
  }
}


/**
 * Inicia el monitoreo del usuario.
 */
async function iniciarMonitoreoUsuario(usuarioId, intervalo = 5 * 60 * 1000) {
  try {
    const usuario = await UsuarioModel.obtenerCredenciales(usuarioId);
    if (!usuario) return console.error(`Usuario con ID ${usuarioId} no encontrado`);

    if (usuario.tiene_sensor !== 1 || !usuario.contrasena_librelink) {
      return console.log(`Usuario ${usuarioId} no tiene sensor o contraseña LibreLink.`);
    }

    const obtenerLectura = async () => {
    try {
      const client = new LibreLinkClient({
        email: usuario.email,
        password: usuario.contrasena_librelink,
        region: 'US',
        language: 'es-ES',
        lluVersion: '4.16.0'
      });

      await client.login();
      const lecturaLibre = await client.read();

      if (lecturaLibre) {
        // Guardar lectura y generar alerta dentro de esta función
        const resultado = await guardarLecturaSensor(lecturaLibre, usuarioId);
        console.log(`✅ Lectura registrada para usuario ${usuarioId}:`, resultado);
      }
    } catch (err) {
      console.error(`❌ Error al obtener lectura del usuario ${usuarioId}:`, err.message);
    }
};


    await obtenerLectura();
    const monitor = setInterval(obtenerLectura, intervalo);
    monitoreosActivos.set(usuarioId, monitor);

    console.log(`▶️ Monitoreo iniciado para usuario ${usuarioId} cada ${intervalo / 1000} segundos`);

    return () => detenerMonitoreoUsuario(usuarioId);

  } catch (error) {
    console.error(`Error iniciando monitoreo para usuario ${usuarioId}:`, error.message);
  }
}

/**
 * Detiene el monitoreo del usuario.
 */
function detenerMonitoreoUsuario(usuarioId) {
  if (monitoreosActivos.has(usuarioId)) {
    clearInterval(monitoreosActivos.get(usuarioId));
    monitoreosActivos.delete(usuarioId);
    console.log(`🛑 Monitoreo detenido para usuario ${usuarioId}`);
    return { mensaje: "Monitoreo detenido", usuarioId };
  } else {
    return { mensaje: "No hay monitoreo activo para este usuario", usuarioId };
  }
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
  guardarLecturaSensor
};
