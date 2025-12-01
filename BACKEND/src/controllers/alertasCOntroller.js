const procesarAlerta = require("../services/procesarAlertaService");

exports.recibirLectura = async (req, res) => {
  try {
    const { usuario_id, valorGlucosa, config } = req.body;

    await procesarAlerta(usuario_id, valorGlucosa, config);

    res.json({ ok: true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error procesando alerta" });
  }
};
