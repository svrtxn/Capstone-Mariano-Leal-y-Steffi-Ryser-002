const { admin } = require('../../BD/firebase/firebaseAdmin');
const db = require('../../BD/mysql');
const bcrypt = require('bcrypt');
const TABLA = 'Usuarios';

async function resetPassword(req, res) {
  const { correo, token, nuevaContrasena } = req.body;

  if (!correo || !token || !nuevaContrasena) {
    return res.status(400).json({ ok: false, mensaje: 'Debe enviar correo, token y nueva contraseña' });
  }

  try {
    // Verificar token y expiración
    const [rows] = await db.query(
      `SELECT * FROM ${TABLA} WHERE email = ? AND resetToken = ?`,
      [correo, token]
    );
    const usuario = rows[0];

    if (!usuario) {
      return res.status(400).json({ ok: false, mensaje: 'Token inválido' });
    }
    if (usuario.resetExpires < Date.now()) {
      return res.status(400).json({ ok: false, mensaje: 'Token expirado' });
    }

    // Actualizar Firebase
    const userRecord = await admin.auth().getUserByEmail(correo);
    await admin.auth().updateUser(userRecord.uid, { password: nuevaContrasena });

    // Actualizar MySQL
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    await db.query(
      `UPDATE ${TABLA} SET contraseña = ?, resetToken = NULL, resetExpires = NULL WHERE email = ?`,
      [hashedPassword, correo]
    );

    res.json({ ok: true, mensaje: 'Contraseña restablecida correctamente' });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ ok: false, mensaje: 'Error al restablecer contraseña', error: error.message });
  }
}

module.exports = { resetPassword };
