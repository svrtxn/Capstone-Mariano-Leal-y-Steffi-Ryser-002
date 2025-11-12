// src/modulos/services/api.ts
import { BASE_URL } from "../../constants/config";
import type { GlucoseCreateRequest, Glucose } from "../types/glucose";
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth";
import { getCurrentUserId, setCurrentUserId } from "./session";

async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try { data = await res.json(); } catch {}

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
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const fallback = (data && (data.mensaje || data.error)) || "";
    const txt = fallback || (await res.text().catch(() => ""));
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }
  return data as T;
}

// ——— Helpers ———
function extractUserIdFromAuth(resp: any): number | null {
  const cand =
    resp?.usuario?.usuario_id ??
    resp?.usuario?.id ??
    resp?.user?.id ??
    resp?.usuario_id ??
    resp?.id ??
    null;
  const n = Number(cand);
  return Number.isNaN(n) ? null : n;
}

export const glucoseApi = {
  // Inserta usuario_id desde la sesión y asegura número para valor_glucosa
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

  // Lista lecturas del usuario
  async listByUser(usuarioId?: number | string) {
    let uid = usuarioId ?? (await getCurrentUserId());
    if (!uid) throw new Error("No hay usuario en sesión.");
    return getJSON<Glucose[]>(`/niveles-glucosa?usuarioId=${uid}`);
  },
};

export const authApi = {
  // Guarda usuario_id en sesión automáticamente
  async login(payload: LoginRequest) {
    const body = { correo: payload.email, contrasena: payload.password };
    const resp = await postJSON<AuthResponse>("/usuarios/inicio-sesion", body);
    const uid = extractUserIdFromAuth(resp);
    if (uid) await setCurrentUserId(uid);
    return resp;
  },

  // Tras el registro, también guarda el usuario_id (si viene en la respuesta)
  async register(payload: RegisterRequest) {
    const body = {
      correo: payload.email,
      contrasena: payload.password,
      nombre: payload.nombre,
      apellido: (payload.apellido ?? "").trim(),
      fechaNacimiento: payload.fecha_nacimiento ?? null,
      telefono: payload.telefono ?? null,
      rol: "diabetico",
      tieneSensor: payload.tiene_sensor ?? false,
      tipoDiabetes: payload.tipo_diabetes ?? null,
    };
    const resp = await postJSON<AuthResponse>("/usuarios/registro", body);
    const uid = extractUserIdFromAuth(resp);
    if (uid) await setCurrentUserId(uid);
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
