// app.js
const express = require('express');
const cors = require('cors');
const config = require('./config/config');

const rutasGlucosa = require('./routes/glucosaRoutes'); 
const rutasUsuarios = require('./routes/usuariosRoutes');
const rutasConfig = require('./routes/configRoutes');
const rutasMonitoreo = require('./routes/monitoreoRoutes');
const rutasContactosApoyo = require("./routes/contactosApoyoRoutes");

const app = express();


app.use(cors());
app.use(express.json());

// Rutas
app.use('/niveles-glucosa', rutasGlucosa);
app.use('/usuarios', rutasUsuarios);
app.use('/config', rutasConfig);
app.use('/', rutasMonitoreo);
app.use("/contactos-apoyo", rutasContactosApoyo);

// Ruta de prueba de salud
app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use("/api/notificaciones", require("./src/routes/notificacionesRoutes"));


module.exports = app;
