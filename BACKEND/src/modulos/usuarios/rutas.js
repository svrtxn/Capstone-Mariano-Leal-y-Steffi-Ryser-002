const express = require('express');
const router = express.Router();
const respuestas = require('../../red/respuestas');
const controlador = require('./controlador');

router.get('/', (req, res) => {
    const todos = controlador.todos()
    .then((items) => {
      respuestas.success(req, res, items, 200);
    });
});

router.get('/error', (req, res) => {
  respuestas.error(req, res, 'No se pudo obtener usuarios', 500);
});

module.exports = router;
