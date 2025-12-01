// src/controllers/glucosaController.js

const GlucosaModel = require('../models/glucosaModel');
const ConfigModel = require('../models/configModel');
const AlertasModel = require('../models/alertasModel');
const firebaseDB = require('../config/firebaseAdmin');
const clasificarAlerta = require('../utils/clasificarAlerta');
const ContactosModel = require("../models/contactosApoyoModel");



const {
  iniciarMonitoreoUsuario: iniciarMonitoreoService,
  detenerMonitoreoUsuario: detenerMonitoreoService,
  obtenerUltimaLectura: obtenerUltimaLecturaService
} = require('../services/monitoreoGlucosaService');

// registro de glucosa
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

    // Validaciones
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

    // Guardar en MySQL
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

    const row = await GlucosaModel.obtenerPorId(insertId);
    if (!row) {
      return res.status(500).json({ mensaje: "Error al recuperar el registro insertado" });
    }

    row.fecha_registro = new Date(row.fecha_registro).toISOString();

    // 🟡 NECESARIO PARA BORRAR / ACTUALIZAR EN FIREBASE
    row.id = insertId;


    // ==============================
    // 🚨 GENERAR ALERTAS
    // ==============================
    let resultadoAlerta = { tipo: "sin_config" };
    const configUsuario = await ConfigModel.obtenerPorUsuario(usuario_id);

    if (configUsuario && configUsuario.notificaciones === 1) {
      resultadoAlerta = clasificarAlerta(Number(valor_glucosa), configUsuario);

      if (resultadoAlerta.tipo !== "verde") {
        const alertaId = await AlertasModel.crear({
          usuario_id,
          tipo_alerta: resultadoAlerta.tipo,
          valor_disparador: Number(valor_glucosa),
          comparador: resultadoAlerta.comparador,
          estado: "activa",
          canal: "push",
          prioridad: resultadoAlerta.prioridad,
          titulo: `Alerta ${resultadoAlerta.tipo.toUpperCase()}`,
          mensaje: `Tu nivel de glucosa es ${valor_glucosa} mg/dL`
        });

        const pushService = require("../services/pushService");
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


    // ==============================
    // 🔥 GUARDAR EN FIREBASE
    // ==============================
    const ref = firebaseDB.db.ref(`niveles_glucosa/${row.usuario_id}`).push();
    await ref.set(row);


    return res.status(201).json({
      ...row,
      alerta: resultadoAlerta.tipo
    });

  } catch (error) {
    console.error('❌ ERROR EN REGISTRAR GLUCOSA:', error);
    return res.status(500).json({
      mensaje: "Error al registrar la glucosa",
      error: error.message
    });
  }
};


// obtener glucosa por usuario
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


// iniciar api de sensor para que haga lecturas 
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


// detener api de sensor
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


// obtener la última lectura de un usuario
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


// ==============================
// 🚨 ELIMINAR UNA GLUCOSA (MySQL + Firebase)
// ==============================
exports.eliminarGlucosa = async (req, res) => {
  try {
    const { glucosaId } = req.params;
    const { usuarioId } = req.body;

    if (!glucosaId || !usuarioId) {
      return res.status(400).json({ mensaje: "glucosaId y usuarioId son obligatorios" });
    }

    // MySQL
    const filas = await GlucosaModel.eliminar(glucosaId, usuarioId);
    if (filas === 0) {
      return res.status(404).json({ mensaje: "Registro no encontrado o no pertenece al usuario" });
    }

    // Firebase
    const ref = firebaseDB.db.ref(`niveles_glucosa/${usuarioId}`);
    const snapshot = await ref.once("value");

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const data = child.val();
        if (Number(data.id) === Number(glucosaId)) {
          firebaseDB.db.ref(`niveles_glucosa/${usuarioId}/${child.key}`).remove();
        }
      });
    }

    return res.json({ mensaje: "Registro eliminado correctamente" });

  } catch (error) {
    console.error("❌ Error eliminando glucosa:", error);
    res.status(500).json({ mensaje: "Error eliminando glucosa", error: error.message });
  }
};



// ==============================
// ✏ ACTUALIZAR GLUCOSA (MySQL + Firebase)
// ==============================
// ==============================
// ✏ ACTUALIZAR GLUCOSA (MySQL + Firebase)
// ==============================
exports.actualizarGlucosa = async (req, res) => {
  try {
    const { glucosaId } = req.params;

    const {
      usuario_id,
      valor_glucosa,
      unidad,
      metodo_registro,
      origen_sensor,
      fecha_registro,
      etiquetado,
      notas
    } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ mensaje: "usuario_id es obligatorio" });
    }

    // 🔥 Normalizamos fecha_registro a objeto Date (como en crear)
    let fechaParaMysql = null;
    if (fecha_registro) {
      const d = new Date(fecha_registro);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ mensaje: "fecha_registro inválida" });
      }
      fechaParaMysql = d;
    }

    const dataActualizacion = {
      valor_glucosa,
      unidad,
      metodo_registro,
      origen_sensor,
      // si no mandas fecha_registro desde el front, usamos la actual
      fecha_registro: fechaParaMysql || new Date(),
      etiquetado,
      notas
    };

    // MySQL
    const filas = await GlucosaModel.actualizar(glucosaId, usuario_id, dataActualizacion);
    if (filas === 0) {
      return res.status(404).json({ mensaje: "Registro no encontrado o no pertenece al usuario" });
    }

    const updated = await GlucosaModel.obtenerPorId(glucosaId);
    updated.fecha_registro = new Date(updated.fecha_registro).toISOString();

    // Firebase
    const ref = firebaseDB.db.ref(`niveles_glucosa/${usuario_id}`);
    const snapshot = await ref.once("value");

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const data = child.val();

        if (Number(data.id) === Number(glucosaId)) {
          firebaseDB.db.ref(`niveles_glucosa/${usuario_id}/${child.key}`).update(updated);
        }
      });
    }

    return res.json({
      mensaje: "Registro actualizado correctamente",
      lectura: updated
    });

  } catch (error) {
    console.error("❌ Error actualizando glucosa:", error);
    res.status(500).json({ mensaje: "Error actualizando glucosa", error: error.message });
  }
};

// ==============================
// 🗑 ELIMINAR TODAS LAS GLUCOSAS
// ==============================
exports.eliminarTodasLasGlucosas = async (req, res) => {
  try {
    const { usuarioId } = req.body;

    if (!usuarioId) {
      return res.status(400).json({ mensaje: "usuarioId es obligatorio" });
    }

    // MySQL
    const filas = await GlucosaModel.eliminarTodas(usuarioId);

    // Firebase
    await firebaseDB.db.ref(`niveles_glucosa/${usuarioId}`).remove();

    return res.json({
      mensaje: "Registros eliminados correctamente",
      eliminados: filas
    });

  } catch (error) {
    console.error("❌ Error eliminando glucosas:", error);
    res.status(500).json({ mensaje: "Error eliminando glucosas", error: error.message });
  }
};
