// app.js
const express = require('express');
const cors = require('cors');
const config = require('./config/config');

const rutasGlucosa = require('./routes/glucosaRoutes'); 
const rutasUsuarios = require('./routes/usuariosRoutes');
const rutasConfig = require('./routes/configRoutes');
const rutasMonitoreo = require('./routes/monitoreoRoutes');
const rutasContactosApoyo = require("./routes/contactosApoyoRoutes");
const rutasNotificaciones = require("./routes/notificacionesRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/niveles-glucosa', rutasGlucosa);
app.use('/usuarios', rutasUsuarios);
app.use('/config', rutasConfig);
app.use('/', rutasMonitoreo);
app.use("/contactos-apoyo", rutasContactosApoyo);
app.use("/api/notificaciones", rutasNotificaciones);

// Ruta de prueba
app.get('/api/health', (_, res) => res.json({ ok: true }));

module.exports = app;
