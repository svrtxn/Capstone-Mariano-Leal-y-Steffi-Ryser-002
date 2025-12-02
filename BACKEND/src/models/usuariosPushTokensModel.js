const db = require("../config/mysql");

const TABLA = "usuarios_push_tokens";

module.exports = {
  async guardarToken(usuario_id, expo_token) {
    const sql = `
      INSERT INTO ${TABLA} (usuario_id, expo_token, activo)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE
        expo_token = VALUES(expo_token),
        activo = 1
    `;

    const [result] = await db.query(sql, [usuario_id, expo_token]);
    return result.insertId || 0;
  },

  async obtenerTokens(usuario_id) {
    const sql = `
      SELECT expo_token FROM ${TABLA}
      WHERE usuario_id = ? AND activo = 1
    `;
    const [rows] = await db.query(sql, [usuario_id]);
    return rows.map((r) => r.expo_token);
  },

  async desactivarToken(expo_token) {
    return db.query(
      `UPDATE ${TABLA} SET activo = 0 WHERE expo_token = ?`,
      [expo_token]
    );
  },
};
