// src/controllers/usuariosController.js
const UsuarioModel = require('../models/usuarioModel');
const { admin } = require('../config/firebaseAdmin');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { LibreLinkClient } = require('libre-link-unofficial-api');
const { guardarLecturaSensor } = require('../services/glucosaService');
const contactosModel = require("../models/contactosApoyoModel");


// Obtener todos los usuarios
async function todos(req, res) {
  try {
    const usuarios = await UsuarioModel.obtenerTodos();
    return res.json(usuarios);
  } catch (error) {
    console.error('USUARIOS.todos', error);
    return res.status(500).json({ mensaje: 'Error interno' });
  }
}

async function registroUsuario(req, res) {
  try {
    const {
      correo, contrasena, nombre, apellido,
      fechaNacimiento, telefono, rol,
      tieneSensor, tipoDiabetes, token_invitacion // <--- aquí agregamos token opcional
    } = req.body;

    let lecturaLibre = null;
    let contrasenaLibreLink = null;

    // --- Validación con LibreLink antes de registrar ---
    if (tieneSensor) {
      try {
        const client = new LibreLinkClient({
          email: correo,
          password: contrasena,
          region: 'US',
          language: 'es-ES',
          lluVersion: '4.16.0'
        });

        await client.login();
        lecturaLibre = await client.read();
        console.log('✅ Cuenta LibreLink validada, lectura inicial:', lecturaLibre);

        contrasenaLibreLink = contrasena;
      } catch (err) {
        console.error('❌ Error validando LibreLink:', err.message);
        return res.status(400).json({
          ok: false,
          mensaje: 'No se pudo validar la cuenta de LibreLink. Verifica correo y contraseña.'
        });
      }
    }

    // --- Crear usuario en DB ---
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const usuario_id = await UsuarioModel.crear({
      nombre,
      apellido,
      email: correo,
      contraseña: hashedPassword,
      fecha_nacimiento: fechaNacimiento || null,
      rol: rol || 'paciente',
      telefono: telefono || null,
      ultimo_login: new Date(),
      fecha_creacion: new Date(),
      tiene_sensor: tieneSensor ? 1 : 0,
      tipo_diabetes: tipoDiabetes || null,
      ...(tieneSensor && { contrasena_librelink: contrasenaLibreLink })
    });

    // --- Crear usuario en Firebase ---
    await admin.auth().createUser({
      uid: String(usuario_id),
      email: correo,
      password: contrasena,
      displayName: `${nombre} ${apellido}`
    });

    if (token_invitacion) {
    const invitacion = await contactosModel.buscarPorToken(token_invitacion);
    if (invitacion) {
      // Marca la invitación como aceptada y asigna el usuario recién creado
      await contactosModel.actualizarEstado(token_invitacion, "aceptada", usuario_id);
    }
  }


    // --- Guardar lectura inicial si tiene sensor ---
    if (lecturaLibre) await guardarLecturaSensor(lecturaLibre, usuario_id);

    // --- ACTUALIZAR INVITACIÓN si viene por token ---
    if (token_invitacion) {
      await contactosModel.actualizarEstado(token_invitacion, "aceptada", usuario_id);
      console.log(`✅ Invitación aceptada automáticamente para usuario ${usuario_id}`);
    }

    // --- Generar JWT ---
    const SECRET = process.env.JWT_SECRET || 'clave_secreta';
    const token = jwt.sign({ id: usuario_id, email: correo }, SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      usuario: {
        id: usuario_id,
        nombre,
        email: correo,
        fecha_registro: new Date().toISOString(),
        tieneSensor: !!tieneSensor
      },
      lecturaLibre
    });

  } catch (error) {
    console.error('Error registroUsuario:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al registrar usuario', error: error.message });
  }
}




// Inicio de sesión
async function login(req, res) {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ ok: false, mensaje: 'Debe enviar correo y contraseña' });

    const usuario = await UsuarioModel.obtenerPorEmail(correo);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    if (!usuario.contraseña) return res.status(400).json({ ok: false, mensaje: 'Usuario no tiene contraseña registrada' });

    const coincide = await bcrypt.compare(contrasena, usuario.contraseña);
    if (!coincide) return res.status(401).json({ ok: false, mensaje: 'Contraseña incorrecta' });

    const token = await admin.auth().createCustomToken(String(usuario.usuario_id));
    await UsuarioModel.actualizarUltimoLogin(usuario.usuario_id);

    let lecturaLibre = null;
    if (usuario.tiene_sensor === 1) {
      try {
        const client = new LibreLinkClient({
          email: correo,
          password: contrasena,
          region: 'US',
          language: 'es-ES',
          lluVersion: '4.16.0'
        });

        await client.login();
        lecturaLibre = await client.read();

        if (lecturaLibre) await guardarLecturaSensor(lecturaLibre, usuario.usuario_id);

      } catch (err) {
        console.error('❌ Error LibreLink login:', err.message);
        lecturaLibre = null; // que no rompa el login
      }
    }

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
    console.error('Error login:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión', error: error.message });
  }
}

// Solicitar restablecimiento de contraseña
async function requestPasswordReset(req, res) {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ ok: false, mensaje: 'Debe enviar un correo' });

    const usuario = await UsuarioModel.obtenerPorEmail(correo);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });

    // --- Validación: si tiene sensor, no permitir reset desde la app ---
    if (usuario.tiene_sensor === 1) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Este usuario tiene sensor. Si no recuerdas la contraseña, debes recuperarla desde LibreLink.'
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600 * 1000; // 1 hora

    await UsuarioModel.actualizarResetToken(correo, token, expires);

    const resetLink = `http://localhost:8081/cambiar-password?token=${token}&email=${correo}`;

    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const info = await transporter.sendMail({
      from: '"Soporte GlucoGuard" soporte@glucoguard.cl>',
      to: correo,
      subject: 'Restablecimiento de contraseña — GlucoGuard',
      html: `
      <div style="font-family: Arial, sans-serif; background-color:#f6f7f9; padding:30px;">
        <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.1);">

          <!-- Encabezado -->
          <div style="background:#3DB7C4; padding:25px; text-align:center;">
            <img src="https://i.postimg.cc/jS9NsK9D/glucoguard-text-white.png" alt="GlucoGuard" style="width:120px; margin-bottom:10px;" />
            <h1 style="color:white; margin:0; font-size:22px; font-weight:600;">
              Restablecimiento de Contraseña
            </h1>
          </div>

          <!-- Cuerpo -->
          <div style="padding:30px; font-size:15px; color:#333; line-height:1.6;">
            <p>Hola <b>${usuario.nombre}</b>,</p>

            <p>
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <b>GlucoGuard</b>.
              Si fuiste tú, por favor presiona el siguiente botón para continuar:
            </p>

            <div style="text-align:center; margin:30px 0;">
              <a href="${resetLink}"
                style="
                  background:#3DB7C4;
                  color:white;
                  padding:14px 24px;
                  border-radius:8px;
                  text-decoration:none;
                  font-size:16px;
                  font-weight:bold;
                  display:inline-block;
                "
              >
                Restablecer Contraseña
              </a>
            </div>

            <p>
              Si no solicitaste este cambio, puedes ignorar este mensaje.  
              El enlace expirará en <b>1 hora</b> por motivos de seguridad.
            </p>

            <p style="margin-top:30px;">
              Saludos,<br>
              <b>Equipo GlucoGuard</b>
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f0f0f0; padding:15px; text-align:center; font-size:12px; color:#777;">
            © ${new Date().getFullYear()} GlucoGuard — Todos los derechos reservados.<br>
            Este correo se envió automáticamente, por favor no respondas a este mensaje.
          </div>

        </div>
      </div>
      `
    });


    res.status(200).json({
      ok: true,
      mensaje: 'Correo de restablecimiento enviado',
      previewURL: nodemailer.getTestMessageUrl(info)
    });

  } catch (error) {
    console.error('Error requestPasswordReset:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al enviar correo', error: error.message });
  }
}


// Cambiar contraseña
async function resetPassword(req, res) {
  try {
    const { correo, token, nuevaContrasena } = req.body;
    if (!correo || !token || !nuevaContrasena) return res.status(400).json({ ok: false, mensaje: 'Debe enviar correo, token y nueva contraseña' });

    const usuario = await UsuarioModel.obtenerPorEmail(correo);
    if (!usuario || usuario.resetToken !== token) return res.status(400).json({ ok: false, mensaje: 'Token inválido' });
    if (usuario.resetExpires < Date.now()) return res.status(400).json({ ok: false, mensaje: 'Token expirado' });

    const userRecord = await admin.auth().getUserByEmail(correo);
    await admin.auth().updateUser(userRecord.uid, { password: nuevaContrasena });

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    await UsuarioModel.actualizarContrasena(correo, hashedPassword);

    res.json({ ok: true, mensaje: 'Contraseña restablecida correctamente' });

  } catch (error) {
    console.error('Error resetPassword:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al restablecer contraseña', error: error.message });
  }
}

module.exports = {
  todos,
  registroUsuario,
  login,
  requestPasswordReset,
  resetPassword
};