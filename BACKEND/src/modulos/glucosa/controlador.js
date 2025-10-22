// src/modulos/glucosa/controlador.js
const db = require('../../BD/mysql'); 
const firebaseDB = require('../../BD/firebase/firebaseAdmin'); // Importa la configuración de Firebase Admin
const TABLA = 'nivelesglucosa'; 

// POST /api/niveles-glucosa
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

      // validaciones
    if (!usuario_id || isNaN(Number(valor_glucosa))) {
      return res.status(400).json({ mensaje: "usuario_id y valor_glucosa válidos son obligatorios" });
    }
    if (!fecha_registro) {
      return res.status(400).json({ mensaje: "fecha_registro es obligatoria (ISO string)" });
    }
    if (!['manual','sensor'].includes(metodo_registro)) {
      return res.status(400).json({ mensaje: "metodo_registro inválido" });
    }
    if (etiquetado && !['antes_comida','despues_comida','ayuno','otro'].includes(etiquetado)) {
      return res.status(400).json({ mensaje: "etiquetado inválido" });
    }

    const insertSQL = `
      INSERT INTO ${TABLA}
      (usuario_id, valor_glucosa, unidad, metodo_registro, origen_sensor, fecha_registro, etiquetado, notas, registrado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertSQL, [
      usuario_id,
      Number(valor_glucosa),
      unidad,
      metodo_registro,
      metodo_registro === 'sensor' ? (origen_sensor || null) : null,
      new Date(fecha_registro), // ISO -> DATETIME
      etiquetado || null,
      notas || null,
      registrado_por || null
    ]);

    const [rows] = await db.query(
      `SELECT glucosa_id, usuario_id, valor_glucosa, unidad, metodo_registro,
              origen_sensor, fecha_registro, etiquetado, notas, registrado_por
       FROM ${TABLA}
       WHERE glucosa_id = ?`,
      [result.insertId]
    );

    const row = rows[0];
    row.fecha_registro = new Date(row.fecha_registro).toISOString();

    const ref = firebaseDB.db.ref(`niveles_glucosa/${row.usuario_id}`).push();
    await ref.set(row);

    console.log('NUEVA GLUCOSA REGISTRADA EN FIREBASE Y MYSQL:', row);

    return res.status(201).json(row);
  } catch (error) {
    console.error('ERROR EN REGISTRAR GLUCOSA:', error);
    return res.status(500).json({ mensaje: "Error al registrar la glucosa", error: error.message });
  }
};

// GET /api/niveles-glucosa?usuarioId=1
exports.listarPorUsuario = async (req, res) => {
  try {
    const usuarioId = Number(req.query.usuarioId);
    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'usuarioId requerido' });
    }

    const [rows] = await db.query(
      `SELECT glucosa_id, usuario_id, valor_glucosa, unidad, metodo_registro,
              origen_sensor, fecha_registro, etiquetado, notas, registrado_por
       FROM ${TABLA}
       WHERE usuario_id = ?
       ORDER BY fecha_registro DESC`,
      [usuarioId]
    );

    const normalized = rows.map(r => ({
      ...r,
      fecha_registro: new Date(r.fecha_registro).toISOString(),
    }));

    return res.json(normalized);
  } catch (error) {
    console.error('ERROR EN LISTAR GLUCOSA:', error);
    return res.status(500).json({ mensaje: "Error al listar la glucosa", error: error.message });
  }
};
