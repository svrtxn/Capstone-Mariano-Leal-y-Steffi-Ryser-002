// src/modulos/services/session.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_ID_KEY = "gg:user_id";
const USER_NAME_KEY = "gg:user_name";
const TOKEN_KEY = "gg:token"; // opcional

// ===== ID =====
export async function setCurrentUserId(id: number | string | null) {
  if (id === null || id === undefined) {
    await AsyncStorage.removeItem(USER_ID_KEY);
    return;
  }
  await AsyncStorage.setItem(USER_ID_KEY, String(id));
}

export async function getCurrentUserId(): Promise<number | null> {
  const v = await AsyncStorage.getItem(USER_ID_KEY);
  return v ? Number(v) : null;
}

// ===== NOMBRE =====
export async function setCurrentUserName(name: string | null) {
  if (!name || !name.trim()) {
    await AsyncStorage.removeItem(USER_NAME_KEY);
    return;
  }
  await AsyncStorage.setItem(USER_NAME_KEY, name.trim());
}

export async function getCurrentUserName(): Promise<string | null> {
  const v = await AsyncStorage.getItem(USER_NAME_KEY);
  return v || null;
}

// ===== TOKEN (opcional) =====
export async function setToken(token: string | null) {
  if (!token) { await AsyncStorage.removeItem(TOKEN_KEY); return; }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
export async function getToken(): Promise<string | null> {
  const t = await AsyncStorage.getItem(TOKEN_KEY);
  return t || null;
}

// ===== LIMPIEZA =====
export async function clearSession() {
  await Promise.all([
    AsyncStorage.removeItem(USER_ID_KEY),
    AsyncStorage.removeItem(USER_NAME_KEY),
    AsyncStorage.removeItem(TOKEN_KEY),
  ]);
}
