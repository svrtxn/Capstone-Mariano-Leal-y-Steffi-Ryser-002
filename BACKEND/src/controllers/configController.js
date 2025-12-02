const ConfigModel = require("../models/configModel");


module.exports = {
  async getConfig(req, res) {
    try {
      const usuarioId = req.params.usuarioId;

      const config = await ConfigModel.obtenerPorUsuario(usuarioId);

      if (!config) {
        return res.status(404).json({ message: "Configuración no encontrada" });
      }

      res.json(config);

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

  async createConfig(req, res) {
    try {
      const usuarioId = req.params.usuarioId;

      const existing = await ConfigModel.obtenerPorUsuario(usuarioId);

      if (existing) {
        return res.status(400).json({ message: "El usuario ya tiene configuración" });
      }

      const configId = await ConfigModel.crear(usuarioId, req.body);

      res.status(201).json({ config_id: configId, ...req.body });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

  async updateConfig(req, res) {
    try {
      const usuarioId = req.params.usuarioId;

      const existing = await ConfigModel.obtenerPorUsuario(usuarioId);

      if (!existing) {
        return res.status(404).json({ message: "Configuración no existe" });
      }

      await ConfigModel.actualizar(usuarioId, req.body);

      res.json({ message: "Configuración actualizada" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  }
};
