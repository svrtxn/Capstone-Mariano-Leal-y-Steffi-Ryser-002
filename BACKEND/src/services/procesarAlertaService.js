const UsuarioModel = require("../models/usuariosModel");
const AlertasModel = require("../models/alertasModel");
const clasificarAlerta = require("../utils/clasificarAlerta");
const { enviarNotificacion } = require("./pushService");

async function procesarAlerta(usuario_id, valorGlucosa, config) {
  try {
    // 1️⃣ Traer usuario (para usar nombre + apellido)
    const usuario = await UsuarioModel.obtenerPorId(usuario_id);

    if (!usuario) {
      console.log("❌ Usuario no encontrado:", usuario_id);
      return;
    }

    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;

    // 2️⃣ Clasificar el valor
    const resultado = clasificarAlerta(valorGlucosa, config);

    // 3️⃣ Guardar alerta en la BD
    const alerta_id = await AlertasModel.crear({
      usuario_id,
      tipo_alerta: resultado.tipo,
      valor_disparador: valorGlucosa,
      comparador: resultado.comparador,
      prioridad: resultado.prioridad
    });

    // 4️⃣ Armar título y cuerpo personalizados
    const titulo = `Alerta para ${nombreCompleto}`;

    let cuerpo;
    switch (resultado.tipo) {
      case "roja":
        cuerpo = `⚠️ Nivel crítico de glucosa: ${valorGlucosa} mg/dL.`;
        break;
      case "amarilla":
        cuerpo = `⚠️ Glucosa fuera de rango: ${valorGlucosa} mg/dL.`;
        break;
      case "verde":
        cuerpo = `✔️ Glucosa normal: ${valorGlucosa} mg/dL.`;
        break;
      default:
        cuerpo = `Glucosa detectada: ${valorGlucosa} mg/dL.`;
    }

    // 5️⃣ Enviar push usando tu pushService
    await enviarNotificacion(usuario_id, titulo, cuerpo, alerta_id);

    return true;

  } catch (error) {
    console.error("❌ Error procesando alerta:", error);
    return false;
  }
}

module.exports = procesarAlerta;
