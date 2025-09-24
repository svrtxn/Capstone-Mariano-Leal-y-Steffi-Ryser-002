// consultas bd
const db = require('../../BD/mysql'); 

const tabla = 'usuarios';

function todos() {
    return db.todos(tabla);
}

module.exports = { todos };
