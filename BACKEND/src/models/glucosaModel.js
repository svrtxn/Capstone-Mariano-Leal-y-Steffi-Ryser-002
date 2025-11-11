// src/models/glucosaModel.js
const db = require('../config/mysql');

const TABLA = 'nivelesglucosa';

const GlucosaModel = {
  // Crear registro de glucosa
  async crear(lectura) {
    const {
      usuario_id,
      valor_glucosa,
      unidad = 'mg/dL',
      metodo_registro = 'manual',
      origen_sensor = null,
      fecha_registro = new Date(),
      etiquetado = null,
      notas = null,
      registrado_por = null
    } = lectura;

    const insertSQL = `
      INSERT INTO ${TABLA}
      (usuario_id, valor_glucosa, unidad, metodo_registro, origen_sensor, fecha_registro, etiquetado, notas, registrado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertSQL, [
      usuario_id,
      valor_glucosa,
      unidad,
      metodo_registro,
      origen_sensor,
      fecha_registro,
      etiquetado,
      notas,
      registrado_por
    ]);

    return result.insertId;
  },

  // Obtener todas las lecturas de un usuario
  async obtenerPorUsuario(usuario_id) {
    const [rows] = await db.query(
      `SELECT glucosa_id, usuario_id, valor_glucosa, unidad, metodo_registro,
              origen_sensor, fecha_registro, etiquetado, notas, registrado_por
       FROM ${TABLA}
       WHERE usuario_id = ?
       ORDER BY fecha_registro DESC`,
      [usuario_id]
    );

    return rows.map(r => ({
      ...r,
      fecha_registro: new Date(r.fecha_registro).toISOString()
    }));
  },

  // Obtener lectura por ID
  async obtenerPorId(glucosa_id) {
    const [rows] = await db.query(
      `SELECT * FROM ${TABLA} WHERE glucosa_id = ?`,
      [glucosa_id]
    );
    return rows[0];
  }
};

module.exports = GlucosaModel;
