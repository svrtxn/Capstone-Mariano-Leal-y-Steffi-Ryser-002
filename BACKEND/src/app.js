// app.js
const express = require('express');
const cors = require('cors');
const config = require('./config/config');

const rutasGlucosa = require('./routes/glucosaRoutes'); 
const rutasUsuarios = require('./routes/usuariosRoutes');
const rutasConfig = require('./routes/configRoutes');
const rutasMonitoreo = require('./routes/monitoreoRoutes');

// Crear la app de Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/niveles-glucosa', rutasGlucosa);
app.use('/usuarios', rutasUsuarios);
app.use('/config', rutasConfig);
app.use('/', rutasMonitoreo);

// Ruta de prueba de salud
app.get('/api/health', (_, res) => res.json({ ok: true }));

module.exports = app;
