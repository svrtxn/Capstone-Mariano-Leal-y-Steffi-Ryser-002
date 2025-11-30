const usuariosPushTokens = require("../models/usuariosPushTokensModel");

exports.registrarExpoToken = async (req, res) => {
  try {
    const { usuario_id, expo_token } = req.body;

    if (!usuario_id || !expo_token) {
      return res.status(400).json({ mensaje: "usuario_id y expo_token son requeridos" });
    }

    await usuariosPushTokens.guardarToken(usuario_id, expo_token);

    return res.json({ ok: true, mensaje: "Token guardado correctamente" });
  } catch (error) {
    console.error("❌ Error guardando token:", error);
    res.status(500).json({ error: "Error guardando token" });
  }
};
