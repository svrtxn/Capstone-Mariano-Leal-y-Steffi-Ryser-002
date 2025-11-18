const db = require('../config/mysql');

const TABLA = 'Usuarios';

const UsuarioModel = {
  // Obtener todos los usuarios
  async obtenerTodos() {
    const [rows] = await db.query(`SELECT * FROM ${TABLA}`);
    return rows;
  },

  // Obtener usuario por ID
  async obtenerPorId(usuario_id) {
    const [rows] = await db.query(`SELECT * FROM ${TABLA} WHERE usuario_id = ?`, [usuario_id]);
    return rows[0];
  },

  // Obtener usuario por email
  async obtenerPorEmail(email) {
    const [rows] = await db.query(`SELECT * FROM ${TABLA} WHERE email = ?`, [email]);
    return rows[0];
  },

  // Crear nuevo usuario
  async crear(usuario) {
    const {
      nombre,
      apellido,
      email,
      contraseña,
      fecha_nacimiento = null,
      rol = 'paciente',
      telefono = null,
      ultimo_login = null,
      fecha_creacion = new Date(),
      tiene_sensor = 0,
      resetToken = null,
      resetExpires = null,
      tipo_diabetes = null,
      contrasena_librelink = null 
    } = usuario;

    const insertSQL = `
      INSERT INTO ${TABLA}
      (nombre, apellido, email, contraseña, fecha_nacimiento, rol, telefono, ultimo_login, fecha_creacion, tiene_sensor, resetToken, resetExpires, tipo_diabetes, contrasena_librelink)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(insertSQL, [
      nombre,
      apellido,
      email,
      contraseña,
      fecha_nacimiento,
      rol,
      telefono,
      ultimo_login,
      fecha_creacion,
      tiene_sensor,
      resetToken,
      resetExpires,
      tipo_diabetes,
      contrasena_librelink
    ]);

    return result.insertId;
  },

  // Actualizar contraseña y limpiar token
  async actualizarContrasena(email, nuevaContrasena) {
    const updateSQL = `
      UPDATE ${TABLA} SET contraseña = ?, resetToken = NULL, resetExpires = NULL
      WHERE email = ?
    `;
    await db.query(updateSQL, [nuevaContrasena, email]);
  },

  // Actualizar resetToken
  async actualizarResetToken(email, token, expires) {
    const updateSQL = `
      UPDATE ${TABLA} SET resetToken = ?, resetExpires = ? WHERE email = ?
    `;
    await db.query(updateSQL, [token, expires, email]);
  },

  // Actualizar último login
  async actualizarUltimoLogin(usuario_id) {
    const updateSQL = `
      UPDATE ${TABLA} SET ultimo_login = ? WHERE usuario_id = ?
    `;
    await db.query(updateSQL, [new Date(), usuario_id]);
  },

  // Obtener credenciales (incluye contrasena_librelink)
  async obtenerCredenciales(usuarioId) {
    const [rows] = await db.query(
      `SELECT email, contraseña, tiene_sensor, contrasena_librelink FROM ${TABLA} WHERE usuario_id = ?`,
      [usuarioId]
    );
    return rows[0];
  }

};

module.exports = UsuarioModel;
