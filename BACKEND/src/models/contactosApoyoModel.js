const db = require("../config/mysql"); 

module.exports = {
  async crearInvitacion(data) {
    const sql = `
      INSERT INTO contactosapoyo 
      (usuario_id, contacto_usuario_id, nombre_contacto, email_contacto, telefono_contacto,
       tipo_contacto, prioridad, habilitado, estado_invitacion, token_invitacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.usuario_id,
      data.contacto_usuario_id || null,
      data.nombre_contacto,
      data.email_contacto,
      data.telefono_contacto,
      data.tipo_contacto || "amigo, familiar, medico",
      data.prioridad || 1,
      1,
      "pendiente",
      data.token_invitacion,
    ];
    const [result] = await db.execute(sql, params);
    return result.insertId;
  },

  async buscarPorToken(token) {
    const sql = `SELECT * FROM contactosapoyo WHERE token_invitacion = ?`;
    const [rows] = await db.execute(sql, [token]);
    return rows[0];
  },

  async actualizarEstado(token, estado, contacto_usuario_id = null) {
    const sql = `
      UPDATE contactosapoyo 
      SET estado_invitacion = ?, contacto_usuario_id = ?
      WHERE token_invitacion = ?
    `;
    const [r] = await db.execute(sql, [estado, contacto_usuario_id, token]);
    return r;
  },

  async rechazarInvitacion(token) {
    const sql = `
      UPDATE contactosapoyo 
      SET estado_invitacion = 'rechazada'
      WHERE token_invitacion = ?
    `;
    const [r] = await db.execute(sql, [token]);
    return r;
  },

  async verificarAcceso(paciente_id, contacto_usuario_id) {
    const sql = `
      SELECT * FROM contactosapoyo
      WHERE usuario_id = ?
      AND contacto_usuario_id = ?
      AND estado_invitacion = 'aceptada'
      AND habilitado = 1
    `;
    const [rows] = await db.execute(sql, [paciente_id, contacto_usuario_id]);
    return rows[0];
  },

  async habilitar(id, value) {
    const sql = `
      UPDATE contactosapoyo SET habilitado = ? WHERE contacto_id = ?
    `;
    const [r] = await db.execute(sql, [value, id]);
    return r;
  },

  async cambiarPrioridad(id, prioridad) {
    const sql = `
      UPDATE contactosapoyo SET prioridad = ? WHERE contacto_id = ?
    `;
    const [r] = await db.execute(sql, [prioridad, id]);
    return r;
  },

  async aceptarInvitacion(token, contacto_usuario_id) {
    const sql = `
      UPDATE contactosapoyo 
      SET estado_invitacion = 'aceptada',
          contacto_usuario_id = ?,
          token_invitacion = NULL
      WHERE token_invitacion = ?
    `;
    const [r] = await db.execute(sql, [contacto_usuario_id, token]);
    return r;
  },

  async verContactos(usuario_id) {
    const sql = `
      SELECT contacto_id, nombre_contacto, email_contacto, telefono_contacto,
             tipo_contacto, prioridad, habilitado, estado_invitacion,
             contacto_usuario_id
      FROM contactosapoyo
      WHERE usuario_id = ?
        AND estado_invitacion = 'aceptada'
    `;
    const [rows] = await db.execute(sql, [usuario_id]);
    return rows;
  },

  async eliminarContacto(contacto_id) {
    const sql = `
      DELETE FROM contactosapoyo
      WHERE contacto_id = ?
    `;
    const [result] = await db.execute(sql, [contacto_id]);
    return result;
  },

  async editarContacto(
    contacto_id,
    nombre_contacto,
    email_contacto,
    telefono_contacto,
    tipo_contacto,
    prioridad,
    habilitado
  ) {
    const sql = `
      UPDATE contactosapoyo
      SET nombre_contacto = ?,
          email_contacto = ?,
          telefono_contacto = ?,
          tipo_contacto = ?,
          prioridad = ?,
          habilitado = ?
      WHERE contacto_id = ?
    `;

    const params = [
      nombre_contacto,
      email_contacto,
      telefono_contacto,
      tipo_contacto,
      prioridad,
      habilitado,
      contacto_id,
    ];

    const [r] = await db.execute(sql, params);
    return r;
  },

  async verInvitacionesEnviadas(usuario_id) {
    const sql = `
      SELECT contacto_id, nombre_contacto, email_contacto, telefono_contacto,
             tipo_contacto, prioridad, habilitado,
             estado_invitacion, contacto_usuario_id, fecha_creacion
      FROM contactosapoyo
      WHERE usuario_id = ?
      ORDER BY fecha_creacion DESC
    `;
    const [rows] = await db.execute(sql, [usuario_id]);
    return rows;
  },

  async verPacientes(contacto_usuario_id) {
    const sql = `
      SELECT 
        c.contacto_id,
        c.usuario_id,
        u.nombre      AS nombre_paciente
      FROM contactosapoyo c
      JOIN usuarios u ON c.usuario_id = u.usuario_id
      WHERE c.contacto_usuario_id = ?
        AND c.estado_invitacion = 'aceptada'
        AND c.habilitado = 1
      ORDER BY c.contacto_id ASC
    `;
    const [rows] = await db.execute(sql, [contacto_usuario_id]);
    return rows;
  },
  async obtenerContactosAceptados(usuario_id) {
    const sql = `
      SELECT contacto_usuario_id
      FROM contactosapoyo
      WHERE usuario_id = ?
        AND habilitado = 1
        AND estado_invitacion = 'aceptada'
        AND contacto_usuario_id IS NOT NULL
    `;
    const [rows] = await db.execute(sql, [usuario_id]);
    return rows.map(r => r.contacto_usuario_id);
}

};
