// src/modulos/usuarios/register.js
const { admin } = require('../../BD/firebase/firebaseAdmin');
const db = require('../../BD/mysql');
const bcrypt = require('bcrypt');

const TABLA = 'Usuarios';

async function registroUsuario(req, res) {
  const { correo, contrasena, nombre, apellido, fechaNacimiento, telefono, rol, tieneSensor, tipoDiabetes } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const fechaCreacion = new Date();
    const ultimoLogin = new Date();

    // Guardar en bd
    const queryUsuario = `
      INSERT INTO Usuarios
      (nombre, apellido, email, contraseña, fecha_nacimiento, rol, telefono, ultimo_login, fecha_creacion, tiene_sensor, tipo_diabetes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.query(queryUsuario, [
      nombre,
      apellido,
      correo,
      hashedPassword,
      fechaNacimiento,
      rol || 'diabetico',
      telefono || null,
      ultimoLogin,
      fechaCreacion,
      tieneSensor ? 1 : 0,
      tipoDiabetes || null 
    ]);

    const usuario_id = result.insertId;

    await connection.commit();

    // Crear usuario en Firebase dsp de que fue insertado en la base de datos
    const userRecord = await admin.auth().createUser({
      uid: String(usuario_id),
      email: correo,
      password: contrasena,
      displayName: `${nombre} ${apellido}`
    });

    const jwt = require("jsonwebtoken");
    const SECRET = process.env.JWT_SECRET || "clave_secreta";

    const token = jwt.sign({ id: usuario_id, email: correo }, SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      usuario: {
        id: usuario_id,
        nombre,
        email: correo,
        fecha_registro: fechaCreacion.toISOString(),
      },
    });


  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar usuario',
      error: error.message
    });
  } finally {
    connection.release();
  }
}

module.exports = { registroUsuario };
