// src/modulos/usuarios/controlador.js
const db = require('../../BD/mysql');
const TABLA = 'Usuarios'; // usa el nombre real de la tabla

async function todos(req, res) {
  try {
    const [rows] = await db.query(`SELECT * FROM ${TABLA}`);
    return res.json(rows);
  } catch (e) {
    console.error('USUARIOS.todos', e);
    return res.status(500).json({ mensaje: 'Error interno' });
  }
}

module.exports = { todos };
