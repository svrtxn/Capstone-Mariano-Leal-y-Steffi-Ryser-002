// monitoreoRoutes.js
const express = require('express');
const router = express.Router();
const { iniciarMonitoreoUsuario, detenerMonitoreoUsuario, obtenerUltimaLectura } = require('../services/monitoreoGlucosaService');

// Iniciar monitoreo REAL
router.post('/niveles-glucosa/monitoreo/iniciar', async (req, res) => {
  const { usuarioId, intervalo } = req.body;
  try {
    const resultado = await iniciarMonitoreoUsuario(usuarioId, intervalo);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detener monitoreo REAL
router.post('/niveles-glucosa/monitoreo/detener', (req, res) => {
  const { usuarioId } = req.body;
  const resultado = detenerMonitoreoUsuario(usuarioId);
  res.json(resultado);
});

// Obtener última lectura
router.get('/niveles-glucosa/monitoreo/ultima-lectura/:usuarioId', async (req, res) => {
  const lectura = await obtenerUltimaLectura(req.params.usuarioId);
  res.json(lectura);
});

module.exports = router;
