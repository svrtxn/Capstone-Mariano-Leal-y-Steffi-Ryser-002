const { Expo } = require("expo-server-sdk");
const expo = new Expo();
const usuariosPushTokens = require("../models/usuariosPushTokensModel");
const AlertasModel = require("../models/alertasModel");


async function enviarNotificacion(usuario_id, titulo, cuerpo, alerta_id) {
  try {
    const tokens = await usuariosPushTokens.obtenerTokens(usuario_id);

    if (tokens.length === 0) {
      console.log(`⚠️ Usuario ${usuario_id} no tiene tokens Expo`);
      return;
    }

    const mensajes = tokens.map(token => ({
      to: token,
      sound: "default",
      title: titulo,
      body: cuerpo,
      data: { alerta_id },
    }));

    const chunks = expo.chunkPushNotifications(mensajes);

    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log("📨 Tickets:", tickets);
        await AlertasModel.marcarEnviada(alerta_id);
      } catch (error) {
        console.error("❌ Error chunk push:", error);
        await AlertasModel.marcarError(alerta_id, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Error general en pushService:", error);
  }
}

async function enviarNotificacionMultiple(listaUsuarios, titulo, cuerpo, alerta_id) {
  for (const uid of listaUsuarios) {
    await enviarNotificacion(uid, titulo, cuerpo, alerta_id);
  }
}

module.exports = {
  enviarNotificacion,
  enviarNotificacionMultiple,
};
