const db = require('../../BD/mysql');
const nodemailer = require('nodemailer'); 
const crypto = require('crypto');
const TABLA = 'Usuarios';

async function requestPasswordReset(req, res) {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ ok: false, mensaje: 'Debe enviar un correo' });
  }

  try {
    // Verificar usuario en MySQL
    const [rows] = await db.query(`SELECT * FROM ${TABLA} WHERE email = ?`, [correo]);
    const usuario = rows[0];

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    // Generar token temporal
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600 * 1000; // 1 hora de validez

    await db.query(
      `UPDATE ${TABLA} SET resetToken = ?, resetExpires = ? WHERE email = ?`,
      [token, expires, correo]
    );

    // Link de restablecimiento (frontend)
    const resetLink = `http://localhost:3000/cambiar-password?token=${token}&email=${correo}`;

    // Crear cuenta de prueba con Ethereal Email
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Enviar correo
    const info = await transporter.sendMail({
      from: '"Soporte GlucoGuard" <no-reply@example.com>',
      to: correo,
      subject: 'Solicitud de restablecimiento de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://i.postimg.cc/TPYG2sf0/glucoguard-Text.png" alt="GlucoGuard" style="width: 150px;"/>
          </div>
          <p>Estimado(a) ${usuario.nombre},</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta GlucoGuard. Para continuar, haz clic en el siguiente enlace:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer contraseña
            </a>
          </p>
          <p>Si no solicitaste este cambio, ignora este correo.</p>
          <p>Atentamente,<br>Equipo de Soporte GlucoGuard</p>
        </div>
      `,
    });

    res.status(200).json({
      ok: true,
      mensaje: 'Correo de restablecimiento enviado',
      previewURL: nodemailer.getTestMessageUrl(info) // útil para Ethereal
    });

  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al enviar correo', error: error.message });
  }
}

module.exports = { requestPasswordReset };
