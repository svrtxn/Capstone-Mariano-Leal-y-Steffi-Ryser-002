const db = require("../config/mysql");

const TABLA = "alertas";

module.exports = {
  async crear({
    usuario_id,
    tipo_alerta,
    valor_disparador,
    comparador,
    prioridad,
    estado = "activa",
    canal = "push"
  }) {
    const sql = `
      INSERT INTO ${TABLA}
      (usuario_id, tipo_alerta, valor_disparador, comparador, estado, canal, prioridad)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      usuario_id,
      tipo_alerta,
      valor_disparador,
      comparador,
      estado,
      canal,
      prioridad
    ]);

    return result.insertId;
  },

  async marcarEnviada(alerta_id) {
    return db.query(
      "UPDATE alertas SET estado = 'enviada', fecha_envio = NOW() WHERE alerta_id = ?",
      [alerta_id]
    );
  },

  async marcarError(alerta_id, error) {
    return db.query(
      "UPDATE alertas SET estado = 'error', error_envio = ? WHERE alerta_id = ?",
      [error, alerta_id]
    );
  }
};
