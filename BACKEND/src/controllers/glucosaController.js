// src/controllers/glucosaController.js

const GlucosaModel = require('../models/glucosaModel');
const firebaseDB = require('../config/firebaseAdmin');

const {
  iniciarMonitoreoUsuario: iniciarMonitoreoService,
  detenerMonitoreoUsuario: detenerMonitoreoService,
  obtenerUltimaLectura: obtenerUltimaLecturaService
} = require('../services/monitoreoGlucosaService');


// =========================================
// POST /api/niveles-glucosa/ingesta
// =========================================
exports.registrarGlucosa = async (req, res) => {
  console.log('REQ.BODY:', req.body);

  try {
    const {
      usuario_id,
      valor_glucosa,
      unidad = 'mg/dL',
      metodo_registro = 'manual',
      origen_sensor = null,
      fecha_registro,
      etiquetado = null,
      notas = null,
      registrado_por = null
    } = req.body || {};

    // 🔹 Validaciones
    if (!usuario_id || isNaN(Number(valor_glucosa))) {
      return res.status(400).json({ mensaje: "usuario_id y valor_glucosa válidos son obligatorios" });
    }
    if (!fecha_registro) {
      return res.status(400).json({ mensaje: "fecha_registro es obligatoria (ISO string)" });
    }
    if (!['manual', 'sensor'].includes(metodo_registro)) {
      return res.status(400).json({ mensaje: "metodo_registro inválido" });
    }
    if (etiquetado && !['antes_comida', 'despues_comida', 'ayuno', 'otro'].includes(etiquetado)) {
      return res.status(400).json({ mensaje: "etiquetado inválido" });
    }

    // 🔹 Crear registro en MySQL usando el modelo
    const insertId = await GlucosaModel.crear({
      usuario_id,
      valor_glucosa: Number(valor_glucosa),
      unidad,
      metodo_registro,
      origen_sensor: metodo_registro === 'sensor' ? (origen_sensor || null) : null,
      fecha_registro: new Date(fecha_registro),
      etiquetado,
      notas,
      registrado_por
    });

    // 🔹 Obtener la fila recién insertada
    const row = await GlucosaModel.obtenerPorId(insertId);
    if (!row) {
      return res.status(500).json({ mensaje: "Error al recuperar el registro insertado" });
    }

    // 🔹 Normalizar fecha
    row.fecha_registro = new Date(row.fecha_registro).toISOString();

    // 🔹 Guardar también en Firebase
    const ref = firebaseDB.db.ref(`niveles_glucosa/${row.usuario_id}`).push();
    await ref.set(row);

    console.log('✅ NUEVA GLUCOSA REGISTRADA EN FIREBASE Y MYSQL:', row);
    return res.status(201).json(row);

  } catch (error) {
    console.error('❌ ERROR EN REGISTRAR GLUCOSA:', error);
    return res.status(500).json({ mensaje: "Error al registrar la glucosa", error: error.message });
  }
};


// =========================================
// GET /api/niveles-glucosa?usuarioId=1
// =========================================
exports.listarPorUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.query.usuarioId);
    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'usuarioId requerido' });
    }

    const lecturas = await GlucosaModel.obtenerPorUsuario(usuarioId);
    return res.json(lecturas);

  } catch (error) {
    console.error('❌ ERROR EN LISTAR GLUCOSA:', error);
    return res.status(500).json({ mensaje: "Error al listar la glucosa", error: error.message });
  }
};


// =========================================
// POST /api/niveles-glucosa/monitoreo/iniciar
// =========================================
exports.iniciarMonitoreoUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.body;
    const resultado = await iniciarMonitoreoService(usuarioId);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error iniciando monitoreo:', error);
    res.status(500).json({ error: 'Error iniciando monitoreo' });
  }
};


// =========================================
// POST /api/niveles-glucosa/monitoreo/detener
// =========================================
exports.detenerMonitoreoUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.body;
    const resultado = await detenerMonitoreoService(usuarioId);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Error deteniendo monitoreo:', error);
    res.status(500).json({ error: 'Error deteniendo monitoreo' });
  }
};


// =========================================
// GET /api/niveles-glucosa/lectura/:usuarioId
// =========================================
exports.obtenerUltimaLectura = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const lectura = await obtenerUltimaLecturaService(usuarioId);
    res.json(lectura);
  } catch (error) {
    console.error('❌ Error obteniendo última lectura:', error);
    res.status(500).json({ error: 'Error obteniendo última lectura' });
  }
};
