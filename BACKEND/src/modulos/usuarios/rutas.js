// src/modulos/usuarios/rutas.js
const express = require('express');
const router = express.Router();

const { registroUsuario } = require('./register');
const { login } = require('./login');              
const { requestPasswordReset } = require('./requestPasswordReset.js');
const { resetPassword } = require('./resetPassword');      

router.post('/registro', registroUsuario);
router.post('/inicio-sesion', login);
router.post('/solicitar-restablecer', requestPasswordReset);
router.post('/restablecer-contrasena', resetPassword);

module.exports = router;
