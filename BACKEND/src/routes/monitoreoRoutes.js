// monitoreoRoutes.js
const express = require('express');
const router = express.Router();
const {
  iniciarMonitoreoUsuario,
  detenerMonitoreoUsuario,
  obtenerUltimaLectura,
} = require('../services/monitoreoGlucosaService');

// Iniciar monitoreo REAL
router.post('/niveles-glucosa/monitoreo/iniciar', async (req, res) => {
  const { usuarioId, intervalo } = req.body;
  try {
    const resultado = await iniciarMonitoreoUsuario(usuarioId, intervalo);
    res.json(resultado);
  } catch (error) {
    console.error('Error en /monitoreo/iniciar:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Detener monitoreo REAL
router.post('/niveles-glucosa/monitoreo/detener', (req, res) => {
  const { usuarioId } = req.body;
  const resultado = detenerMonitoreoUsuario(usuarioId);
  res.json(resultado);
});

// Obtener última lectura
router.get(
  '/niveles-glucosa/monitoreo/ultima-lectura/:usuarioId',
  async (req, res) => {
    try {
      const lectura = await obtenerUltimaLectura(req.params.usuarioId);
      res.json(lectura);
    } catch (err) {
      console.error('Error en /monitoreo/ultima-lectura:', err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }
);

module.exports = router;
