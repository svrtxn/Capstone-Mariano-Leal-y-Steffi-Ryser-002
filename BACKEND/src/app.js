// app.js
const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

const rutasGlucosa = require('./modulos/glucosa/rutas');
const rutasUsuarios = require('./modulos/usuarios/rutas');

app.use('/niveles-glucosa', rutasGlucosa);
app.use('/usuarios', rutasUsuarios);    

app.get('/api/health', (_, res) => res.json({ ok: true }));

module.exports = app;
