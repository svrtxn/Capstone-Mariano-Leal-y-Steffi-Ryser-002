const express = require('express');
const router = express.Router();
const respuestas = require('../../red/respuestas');

router.get('/', (req, res) => {
  respuestas.success(req, res, 'Usuarios obtenidos correctamente', 200);
});

router.get('/error', (req, res) => {
  respuestas.error(req, res, 'No se pudo obtener usuarios', 500);
});

module.exports = router;
