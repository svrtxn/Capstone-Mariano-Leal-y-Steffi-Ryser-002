// src/modulos/services/api.ts
import { BASE_URL } from "../../constants/config";
import type { GlucoseCreateRequest, Glucose } from "../types/glucose";
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth";
import { getCurrentUserId, setCurrentUserId, setCurrentUserName } from "./session";

async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const fallback = (data && (data.mensaje || data.error)) || "";
    const txt = fallback || (await res.text().catch(() => ""));
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }
  if (data && typeof data.ok === "boolean" && !data.ok) {
    throw new Error(data.mensaje || "Error del servidor");
  }
  return data as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const fallback = (data && (data.mensaje || data.error)) || "";
    const txt = fallback || (await res.text().catch(() => ""));
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }
  return data as T;
}

// Extrae usuario.id de la respuesta del backend
function extractUserIdFromAuth(resp: AuthResponse): number {
  const id = resp?.usuario?.id;
  if (typeof id !== "number") {
    throw new Error("Respuesta de autenticación inválida: falta usuario.id");
  }
  return id;
}

// ================== API GLUCOSA ==================
export const glucoseApi = {
  async create(payload: GlucoseCreateRequest) {
    const uid = await getCurrentUserId();
    if (!uid) throw new Error("No hay usuario en sesión para registrar glucosa.");

    const valor = Number(payload.valor_glucosa);
    if (!Number.isFinite(valor)) throw new Error("El valor de glucosa debe ser numérico.");

    const body: GlucoseCreateRequest = {
      ...payload,
      usuario_id: uid,
      valor_glucosa: valor,
    };

    return postJSON<Glucose>("/niveles-glucosa/ingesta", body);
  },

  async listByUser(usuarioId?: number | string) {
    let uid = usuarioId ?? (await getCurrentUserId());
    if (!uid) throw new Error("No hay usuario en sesión.");
    return getJSON<Glucose[]>(`/niveles-glucosa?usuarioId=${uid}`);
  },
};

export const authApi = {
  async login(payload: LoginRequest) {
    const body = { correo: payload.email, contrasena: payload.password };

    // 👇 Usa la ruta que ya tenías antes y que cuadra mejor con tu controller
    const resp = await postJSON<AuthResponse>("/usuarios/inicio-sesion", body);

    const uid = extractUserIdFromAuth(resp);
    if (uid) await setCurrentUserId(uid);
    return resp;
  },

  async register(payload: RegisterRequest) {
    const body = {
      correo: payload.email,
      contrasena: payload.password,
      nombre: payload.nombre,
      apellido: (payload.apellido ?? "").trim(),
      fechaNacimiento: payload.fecha_nacimiento ?? null,
      telefono: payload.telefono ?? null,
      tieneSensor: payload.tiene_sensor ?? false,
      tipoDiabetes:
      payload.tipo_diabetes === "tipo1"
        ? "tipo1"
        : payload.tipo_diabetes === "tipo2"
        ? "tipo2"
        : null,
    };
    const resp = await postJSON<AuthResponse>("/usuarios/registro", body);
    const uid = extractUserIdFromAuth(resp);
    if (uid) {
      await setCurrentUserId(uid);

      // 🔥 GUARDAR EL NOMBRE DEL USUARIO
      const nombre = resp?.usuario?.nombre ?? "";
      await setCurrentUserName(nombre);
    }

      return resp;
  },

  requestPasswordReset(email: string) {
    return postJSON<{ ok: boolean; mensaje?: string; previewURL?: string }>(
      "/usuarios/solicitar-restablecer",
      { correo: email }
    );
  },

  resetPassword(correo: string, token: string, nuevaContrasena: string) {
    return postJSON<{ ok: boolean; mensaje?: string }>(
      "/usuarios/restablecer-contrasena",
      { correo, token, nuevaContrasena }
    );
  },
};
