// src/config/mysql.js
const mysql = require('mysql2/promise');
const config = require('./config'); 

const db = mysql.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection()
  .then(() => console.log('✅ Conectado a la base de datos'))
  .catch((err) => console.error('Error de conexión:', err));

module.exports = db;
