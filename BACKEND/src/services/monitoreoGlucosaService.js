const { guardarLecturaSensor } = require('./glucosaService');
const LibreLinkClient = require('./LibreLinkClient');
const GlucosaModel = require('../models/glucosaModel');
const firebaseDB = require('../config/firebaseAdmin');

// Guardamos los monitoreos activos en memoria
const monitoreosActivos = new Map();

/**
 * Inicia el monitoreo periódico de glucosa de un usuario
 * @param {number} usuarioId
 * @param {number} intervalo - en milisegundos (por defecto cada 5 min)
 */
async function iniciarMonitoreoUsuario(usuarioId, intervalo = 5 * 60 * 1000) {
  console.log(`⏱️ Iniciando monitoreo de glucosa para usuario ${usuarioId}`);

  if (!usuarioId) throw new Error("usuarioId es requerido");

  // Evita duplicar monitoreo
  if (monitoreosActivos.has(usuarioId)) {
    console.log(`⚠️ Ya existe un monitoreo activo para usuario ${usuarioId}`);
    return { mensaje: 'Monitoreo ya activo', usuarioId };
  }

  const obtenerYGuardarLectura = async () => {
    try {
      const lectura = await LibreLinkClient.read(usuarioId);
      if (!lectura) {
        console.warn(`⚠️ No se obtuvo lectura del sensor para usuario ${usuarioId}`);
        return;
      }

      await guardarLecturaSensor(lectura, usuarioId);

      // También guardamos en Firebase
      const ref = firebaseDB.db.ref(`niveles_glucosa/${usuarioId}`).push();
      await ref.set(lectura);

      console.log(`📈 Lectura guardada para usuario ${usuarioId}:`, lectura.valor_glucosa);
    } catch (error) {
      console.error(`❌ Error al consultar el sensor para usuario ${usuarioId}:`, error.message);
    }
  };

  // Ejecutar una lectura inmediata
  obtenerYGuardarLectura();

  // Programar lecturas periódicas
  const intervalId = setInterval(obtenerYGuardarLectura, intervalo);
  monitoreosActivos.set(usuarioId, intervalId);

  return { mensaje: 'Monitoreo iniciado', usuarioId };
}

/**
 * Detiene el monitoreo activo de un usuario
 */
async function detenerMonitoreoUsuario(usuarioId) {
  console.log(`⏹️ Deteniendo monitoreo de glucosa para usuario ${usuarioId}`);

  if (!monitoreosActivos.has(usuarioId)) {
    return { mensaje: 'No hay monitoreo activo', usuarioId };
  }

  clearInterval(monitoreosActivos.get(usuarioId));
  monitoreosActivos.delete(usuarioId);

  return { mensaje: 'Monitoreo detenido', usuarioId };
}

/**
 * Obtiene la última lectura de glucosa (desde MySQL)
 */
async function obtenerUltimaLectura(usuarioId) {
  console.log(`🔍 Obteniendo última lectura para usuario ${usuarioId}`);

  const lecturas = await GlucosaModel.obtenerPorUsuario(usuarioId);
  if (!lecturas.length) {
    return { mensaje: 'Sin lecturas registradas' };
  }

  const ultima = lecturas[0];
  return {
    mensaje: 'Última lectura obtenida',
    lectura: ultima
  };
}

module.exports = {
  iniciarMonitoreoUsuario,
  detenerMonitoreoUsuario,
  obtenerUltimaLectura
};
