const express = require('express');
const router = express.Router();

const glucosaController = require('../controllers/glucosaController');

router.get('/', glucosaController.listarPorUsuario);
router.post('/ingesta', glucosaController.registrarGlucosa);

router.post('/monitoreo/iniciar', glucosaController.iniciarMonitoreoUsuario);
router.post('/monitoreo/detener', glucosaController.detenerMonitoreoUsuario);
router.get('/lectura/:usuarioId', glucosaController.obtenerUltimaLectura);

module.exports = router;
