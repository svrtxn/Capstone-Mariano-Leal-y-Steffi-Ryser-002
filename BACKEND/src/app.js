const express = require('express');
const cors = require('cors');
const config = require('./config');

// Rutas modulares
const rutasGlucosa = require('./modulos/glucosa/rutas');
const rutasUsuarios = require('./modulos/usuarios/rutas'); // si la tienes

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());

// Monta rutas
app.use('/api/niveles-glucosa', rutasGlucosa);
app.use('/api/usuarios', rutasUsuarios); // opcional

// Health
app.get('/api/health', (_, res) => res.json({ ok: true }));

module.exports = app;
