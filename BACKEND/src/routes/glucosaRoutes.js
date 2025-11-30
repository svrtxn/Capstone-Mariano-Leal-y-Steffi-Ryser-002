const express = require('express');
const router = express.Router();

const glucosaController = require('../controllers/glucosaController');

router.get('/', glucosaController.listarPorUsuario);
router.post('/ingesta', glucosaController.registrarGlucosa);

router.post('/monitoreo/iniciar', glucosaController.iniciarMonitoreoUsuario);
router.post('/monitoreo/detener', glucosaController.detenerMonitoreoUsuario);
router.get('/lectura/:usuarioId', glucosaController.obtenerUltimaLectura);
router.put('/editar/:glucosaId', glucosaController.actualizarGlucosa);
router.delete('/eliminar/:glucosaId', glucosaController.eliminarGlucosa);
router.delete('/eliminar/todas/:usuarioId', glucosaController.eliminarTodasLasGlucosas);


module.exports = router;
