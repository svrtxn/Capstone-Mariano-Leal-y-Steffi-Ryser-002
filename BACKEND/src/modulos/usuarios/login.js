// src/modulos/usuarios/login.js
const { admin } = require('../../BD/firebase/firebaseAdmin');
const db = require('../../BD/mysql');
const bcrypt = require('bcrypt');
const { LibreLinkClient } = require('libre-link-unofficial-api');

const TABLA = 'Usuarios';

async function login(req, res) {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ ok: false, mensaje: 'Debe enviar correo y contraseña' });
  }

  try {
    // Buscar usuario en la base de datos
    const [rows] = await db.query(`SELECT * FROM ${TABLA} WHERE email = ?`, [correo]);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    if (!usuario.contraseña) {
      return res.status(400).json({ ok: false, mensaje: 'Usuario no tiene contraseña registrada' });
    }

    // Verificar contraseña
    const coincide = await bcrypt.compare(contrasena, usuario.contraseña);
    if (!coincide) {
      return res.status(401).json({ ok: false, mensaje: 'Contraseña incorrecta' });
    }

    // Crear token personalizado de Firebase
    const token = await admin.auth().createCustomToken(String(usuario.usuario_id));

    // Actualizar último login
    await db.query(`UPDATE ${TABLA} SET ultimo_login = ? WHERE usuario_id = ?`, [
      new Date(),
      usuario.usuario_id,
    ]);

    // --- Conectar con Libre Link si tiene sensor ---
    let lecturaLibre = null;
    if (usuario.tiene_sensor === 1) {
      try {
        const client = new LibreLinkClient({
          email: correo,
          password: contrasena,
          patientId: 'dummy'
        });
        await client.login();
        lecturaLibre = await client.read();
        console.log('Lectura LibreLink del usuario:', lecturaLibre);

      } catch (err) {
        console.error('Error conectando con Libre Link API:', err.message);
      }
    }

    // Respuesta exitosa
    res.json({
      ok: true,
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.usuario_id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.email,
        rol: usuario.rol,
        tieneSensor: usuario.tiene_sensor === 1
      },
      lecturaLibre
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión', error: error.message });
  }
}

module.exports = { login };
