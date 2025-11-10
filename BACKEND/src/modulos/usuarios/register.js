// src/modulos/usuarios/register.js
const { admin } = require('../../BD/firebase/firebaseAdmin');
const db = require('../../BD/mysql');
const bcrypt = require('bcrypt');
const { LibreLinkClient } = require('libre-link-unofficial-api');

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

    // Guardar usuario en la base de datos
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

    // Crear usuario en Firebase
    const userRecord = await admin.auth().createUser({
      uid: String(usuario_id),
      email: correo,
      password: contrasena,
      displayName: `${nombre} ${apellido}`
    });

    // --- Conectar con Libre Link si tiene sensor ---
    let lecturaLibre = null;
    if (tieneSensor) {
      try {
        const client = new LibreLinkClient({
          email: correo,
          password: contrasena,
          patientId: 'dummy' // opcional
        });
        await client.login();
        lecturaLibre = await client.read();
        console.log('Lectura inicial del usuario:', lecturaLibre);

        // Aquí podrías guardar lectura en tabla Lecturas si quieres

      } catch (err) {
        console.error('Error conectando con Libre Link API:', err.message);
      }
    }

    // Generar JWT
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
        tieneSensor: !!tieneSensor
      },
      lecturaLibre
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
