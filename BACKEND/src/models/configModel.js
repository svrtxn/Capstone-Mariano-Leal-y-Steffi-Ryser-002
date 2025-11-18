// src/models/ConfigModel.js
const db = require('../config/mysql');

const TABLA = 'configuraciones';

const ConfigModel = {
  // Obtener configuración por usuario
  async obtenerPorUsuario(usuario_id) {
    const [rows] = await db.query(
      `SELECT * FROM ${TABLA} WHERE usuario_id = ? LIMIT 1`,
      [usuario_id]
    );
    return rows[0] || null;
  },

  // Crear nueva configuración
  async crear(usuario_id, datos) {
    const {
      hipo_min = 70,
      normal_min = 70,
      normal_max = 140,
      hiper_max = 140,
      frecuencia_medicion = 240,
      notificaciones = 1,
      zona_horaria = "America/Santiago",
      idioma = "es"
    } = datos;

    const insertSQL = `
      INSERT INTO ${TABLA}
      (usuario_id, hipo_min, normal_min, normal_max, hiper_max, frecuencia_medicion,
       notificaciones, zona_horaria, idioma)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertSQL, [
      usuario_id,
      hipo_min,
      normal_min,
      normal_max,
      hiper_max,
      frecuencia_medicion,
      notificaciones,
      zona_horaria,
      idioma
    ]);

    return result.insertId;
  },

  // Actualizar configuración existente
  async actualizar(usuario_id, datos) {
    const setSQL = Object.keys(datos)
      .map(key => `${key} = ?`)
      .join(", ");

    const values = Object.values(datos);

    const updateSQL = `
      UPDATE ${TABLA}
      SET ${setSQL}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE usuario_id = ?
    `;

    const [result] = await db.query(updateSQL, [...values, usuario_id]);
    return result.affectedRows > 0;
  }
};

module.exports = ConfigModel;
