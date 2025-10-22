// src/modulos/glucosa/rutas.js
const express = require('express');
const ctrl = require('./controlador');
const router = express.Router();

router.get('/', ctrl.listarPorUsuario);
router.post('/ingesta', ctrl.registrarGlucosa);

module.exports = router;
