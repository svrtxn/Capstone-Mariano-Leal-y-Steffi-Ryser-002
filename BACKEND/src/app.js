const express = require('express');
const config = require('./config');

const usuarios = require('./modulos/usuarios/rutas.js');

const app = express();

// configuraciones
app.set('port', config.app.port);

// rutas
app.use('/api/usuarios', usuarios)



module.exports = app;