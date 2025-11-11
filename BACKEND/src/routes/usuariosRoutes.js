const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

router.get('/', usuariosController.todos);
router.post('/registro', usuariosController.registroUsuario);
router.post('/inicio-sesion', usuariosController.login);
router.post('/solicitar-restablecer', usuariosController.requestPasswordReset);
router.post('/restablecer-contrasena', usuariosController.resetPassword);

module.exports = router;
