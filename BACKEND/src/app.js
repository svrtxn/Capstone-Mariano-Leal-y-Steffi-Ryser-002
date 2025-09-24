const express = require('express');
const config = require('./config');
const cors = require('cors'); 

const app = express();

app.use(cors()); // permitir conexiones de otros orígenes
app.use(express.json()); // parsear json

// Rutas
const usuariosRoutes = require('./modulos/usuarios/rutas.js');
const glucosaRoutes = require('./modulos/glucosa/rutas.js');

app.set('port', config.app.port);

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/glucosa', glucosaRoutes);

module.exports = app;
