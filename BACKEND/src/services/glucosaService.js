const db = require('../config/mysql');
const firebaseDB = require('../config/firebaseAdmin');

const ConfigModel = require('../models/configModel');
const AlertasModel = require('../models/alertasModel');
const clasificarAlerta = require('../utils/clasificarAlerta');

const TABLA = 'nivelesglucosa';

async function guardarLecturaSensor(lectura, usuarioId) {
  try {
    const valor =
      lectura.value ||
      lectura._raw?.ValueInMgPerDl ||
      null;

    const fecha =
      lectura.timestamp ||
      lectura._raw?.Timestamp ||
      new Date();

    const unidad = 'mg/dL';
    const origen_sensor = 'LibreLinkUp';

    if (!valor || isNaN(Number(valor))) {
      console.warn('⚠️ Lectura inválida, se omite:', lectura);
      return null;
    }

    const fechaRegistro = new Date(fecha);

    const [existente] = await db.query(
      `SELECT glucosa_id FROM ${TABLA} WHERE usuario_id = ? AND fecha_registro = ? LIMIT 1`,
      [usuarioId, fechaRegistro]
    );

    if (existente.length > 0) {
      console.log('ℹ️ Lectura ya registrada, se omite duplicado.');
      return null;
    }

    const insertSQL = `
      INSERT INTO ${TABLA}
      (usuario_id, valor_glucosa, unidad, metodo_registro, origen_sensor, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertSQL, [
      usuarioId,
      Number(valor),
      unidad,
      'sensor',
      origen_sensor,
      fechaRegistro
    ]);

    // Obtener fila insertada
    const [rows] = await db.query(
      `SELECT glucosa_id, usuario_id, valor_glucosa, unidad, metodo_registro,
              origen_sensor, fecha_registro
       FROM ${TABLA}
       WHERE glucosa_id = ?`,
      [result.insertId]
    );

    const row = rows[0];
    row.fecha_registro = new Date(row.fecha_registro).toISOString();

    let resultadoAlerta = { tipo: "sin_config" };

    const config = await ConfigModel.obtenerPorUsuario(usuarioId);

    if (config && config.notificaciones === 1) {
      resultadoAlerta = clasificarAlerta(Number(valor), config);

      // Registrar solo roja o amarilla (no verde)
      if (resultadoAlerta.tipo !== "verde") {
        await AlertasModel.crear({
          usuario_id: usuarioId,
          tipo_alerta: resultadoAlerta.tipo,
          valor_disparador: Number(valor),
          comparador: resultadoAlerta.comparador,
          estado: "pendiente",
          canal: "push",
          prioridad: resultadoAlerta.prioridad
        });
      }
    }

    const ref = firebaseDB.db.ref(`niveles_glucosa/${usuarioId}`).push();
    await ref.set(row);

    console.log('📡 Lectura LibreLinkUp guardada:', row);
    console.log('🚨 Tipo de alerta:', resultadoAlerta);

    return {
      ...row,
      alerta: resultadoAlerta.tipo
    };

  } catch (error) {
    console.error('❌ Error guardando lectura LibreLinkUp:', error.message);
    return null;
  }
}

module.exports = { guardarLecturaSensor };
