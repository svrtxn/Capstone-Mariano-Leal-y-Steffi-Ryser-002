//ruta glucosa

const express = require('express');
const router = express.Router();
const { registrarGlucosa } = require('./controlador');

router.post('/glucosa', registrarGlucosa);

module.exports = router;
