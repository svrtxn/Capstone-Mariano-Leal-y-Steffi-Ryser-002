const db = require('../config/mysql');

const TABLA = 'alertas';

module.exports = {
  /**
   * Crear una alerta completa
   */
  async crear({
    usuario_id,
    tipo_alerta,
    valor_disparador,
    comparador,
    prioridad,
    estado = 'activa',
    canal = 'push',
    activo_desde = null,
    activo_hasta = null
  }) {
    try {
      const fecha_creacion = new Date();

      const sql = `
        INSERT INTO ${TABLA}
        (usuario_id, tipo_alerta, valor_disparador, comparador, estado, canal, prioridad, fecha_creacion, activo_desde, activo_hasta)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(sql, [
        usuario_id,
        tipo_alerta,
        valor_disparador,
        comparador,
        estado,
        canal,
        prioridad,
        fecha_creacion,
        activo_desde,
        activo_hasta
      ]);

      return result.insertId;
    } catch (error) {
      console.error("❌ ERROR GUARDANDO ALERTA:", error);
      throw error;
    }
  },

  /**
   * Obtener por usuario
   */
  async obtenerPorUsuario(usuario_id) {
    const [rows] = await db.query(
      `SELECT * FROM ${TABLA} WHERE usuario_id = ? ORDER BY fecha_creacion DESC`,
      [usuario_id]
    );
    return rows;
  },

  async actualizar(id, datos) {
  try {
    const [result] = await db.query(
      "UPDATE glucosa SET ? WHERE id = ?",
      [datos, id]
    );
    return result;
  } catch (error) {
    console.error("❌ ERROR EN GlucosaModel.actualizar:", error);
    throw error;
  }
}  

};
