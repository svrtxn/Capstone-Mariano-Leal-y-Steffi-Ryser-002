// src/modulos/services/api.ts
import { BASE_URL } from "../../constants/config";
import type { GlucoseCreateRequest, Glucose } from "../types/glucose";
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth";

async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // si no hay JSON, queda en null y usamos el texto tradicional
  }

  if (!res.ok) {
    const fallback = (data && (data.mensaje || data.error)) || "";
    const txt = fallback || (await res.text().catch(() => ""));
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }

  // si el backend envía ok:false, lo tratamos también como error
  if (data && typeof data.ok === "boolean" && !data.ok) {
    throw new Error(data.mensaje || "Error del servidor");
  }

  return data as T;
}

export const glucoseApi = {
  create(payload: GlucoseCreateRequest) {
    return postJSON<Glucose>("/niveles-glucosa/ingesta", payload);
  },
};

export const authApi = {
  login(payload: LoginRequest) {
    const body = {
      correo: payload.email,
      contrasena: payload.password,
    };
    return postJSON<AuthResponse>("/usuarios/inicio-sesion", body);
  },

  register(payload: RegisterRequest) {
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
    return postJSON<AuthResponse>("/usuarios/registro", body);
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
