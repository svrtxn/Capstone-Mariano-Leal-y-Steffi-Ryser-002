const mysql = require('mysql');
const config = require('../config');

const dbconfig = {
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
};

let conexion;

function conmysql() {
  conexion = mysql.createConnection(dbconfig);

  conexion.connect((err) => {
    if (err) {
      console.error('Error de conexion: ' + err.stack);
      setTimeout(conmysql, 2000);
    } else {
      console.log('✅ Conectado a la base de datos');
    }
  });

  conexion.on('error', (err) => {
    console.error('DB error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      conmysql();
    } else {
      throw err;
    }
  });
}

conmysql();

function todos(tabla) {
    return  new Promise((resolve, reject) => {
        conexion.query(`SELECT * FROM ${tabla}`, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        })
    })
};

function uno(tabla, id) {}

function agregar(tabla, data) {}

function eliminar(tabla, id) {}

module.exports = { 
    todos, 
    uno, 
    agregar, 
    eliminar 
};