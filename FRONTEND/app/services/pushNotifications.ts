// @ts-nocheck
// src/modulos/services/pushNotifications.ts

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { notificacionesApi } from "./api";
import { getCurrentUserId } from "./session"; // 👈 importante

// 🧾 Obtenemos el projectId real desde la config de Expo (EAS)
const PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId ??
  Constants?.manifest?.extra?.eas?.projectId ??
  null;

// 🛎 Cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // mostrar banner
    shouldPlaySound: true,   // reproducir sonido
    shouldSetBadge: false,   // no tocar el badge del ícono
  }),
});

// 🧩 Registrar el ExpoPushToken y enviarlo a tu backend
export async function registerExpoPushToken(): Promise<string | null> {
  try {
    // 1) Permisos de notificación
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Permisos de notificaciones no concedidos");
      return null;
    }

    // 2) Obtener ExpoPushToken usando el projectId de EAS (si existe)
    let tokenResponse;
    try {
      if (PROJECT_ID) {
        tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId: PROJECT_ID,
        });
      } else {
        console.warn(
          "⚠️ No se encontró projectId en la config de Expo. Se intenta sin projectId (podría fallar)."
        );
        tokenResponse = await Notifications.getExpoPushTokenAsync();
      }
    } catch (err: any) {
      console.error("Error obteniendo ExpoPushToken:", err?.message || err);
      return null;
    }

    const expoToken = tokenResponse.data;
    console.log("🔔 Expo push token obtenido:", expoToken);

    // 3) Canal Android (recomendado)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // 4) Obtener el usuario_id desde la sesión
    const usuario_id = await getCurrentUserId();
    if (!usuario_id) {
      console.warn(
        "No hay usuario en sesión al registrar el push token; no se envía al backend."
      );
      return expoToken; // igual devolvemos el token para debug
    }

    // 5) Enviar token + usuario_id al backend
    await notificacionesApi.registrarToken({
      usuario_id,
      expo_token: expoToken,
    });

    return expoToken;
  } catch (err) {
    console.error("Error registrando push token", err);
    return null;
  }
}
