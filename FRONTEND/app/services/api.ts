// src/modulos/services/api.ts
import { BASE_URL } from "../../constants/config";
import type { GlucoseCreateRequest, Glucose } from "../types/glucose";
import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth";
import {
  getCurrentUserId,
  setCurrentUserId,
  setCurrentUserName,
} from "./session";

/* =========================
   HELPERS HTTP GENÉRICOS
   ========================= */

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

async function putJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
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
  return data as T;
}

async function deleteJSON<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
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

/* =========================
   API GLUCOSA
   ========================= */

export const glucoseApi = {
  async create(payload: GlucoseCreateRequest) {
    const uid = await getCurrentUserId();
    if (!uid)
      throw new Error("No hay usuario en sesión para registrar glucosa.");

    const valor = Number(payload.valor_glucosa);
    if (!Number.isFinite(valor)) {
      throw new Error("El valor de glucosa debe ser numérico.");
    }

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

  // 🗑 eliminar UNA lectura (respeta tu back: body.usuarioId)
  async deleteOne(glucosaId: number) {
    const uid = await getCurrentUserId();
    if (!uid) throw new Error("No hay usuario en sesión.");

    return deleteJSON<{ mensaje?: string }>(
      `/niveles-glucosa/eliminar/${glucosaId}`,
      { usuarioId: uid }
    );
  },

  // 🗑 eliminar TODAS las lecturas de un usuario (back espera usuarioId en body)
  async deleteAllByUser() {
    const uid = await getCurrentUserId();
    if (!uid) throw new Error("No hay usuario en sesión.");

    return deleteJSON<{ mensaje?: string; eliminados?: number }>(
      `/niveles-glucosa/eliminar/todas/${uid}`,
      { usuarioId: uid }
    );
  },

  // ✏ actualizar una lectura
  async update(
    glucosaId: number,
    data: {
      valor_glucosa: number;
      unidad: string;
      metodo_registro: "manual" | "sensor";
      origen_sensor: string | null;
      fecha_registro: string;
      etiquetado: "antes_comida" | "despues_comida" | "ayuno" | "otro" | null;
      notas: string | null;
    }
  ) {
    const uid = await getCurrentUserId();
    if (!uid) throw new Error("No hay usuario en sesión.");

    const body = {
      usuario_id: uid,
      ...data,
    };

    return putJSON<{
      mensaje: string;
      lectura: Glucose;
    }>(`/niveles-glucosa/editar/${glucosaId}`, body);
  },
};

/* =========================
   API AUTH
   ========================= */

export const authApi = {
  async login(payload: LoginRequest) {
    const body = { correo: payload.email, contrasena: payload.password };

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

/* =========================
   API CONTACTOS APOYO
   ========================= */

export const contactosApi = {
  // 1) Enviar invitación (AmigosScreen)
  async invitarContacto(data: {
    nombre_contacto: string;
    email_contacto: string;
    telefono_contacto?: string;
    tipo_contacto: string;
  }) {
    const usuario_id = await getCurrentUserId();
    if (!usuario_id) throw new Error("No hay sesión activa.");

    const body = {
      usuario_id,
      nombre_contacto: data.nombre_contacto,
      email_contacto: data.email_contacto,
      telefono_contacto: data.telefono_contacto ?? "",
      tipo_contacto: data.tipo_contacto,
    };

    return postJSON<{
      msg: string;
      contacto_id: number;
      token?: string;
      previewURL?: string;
    }>("/contactos-apoyo/invitar", body);
  },

  // 2) Aceptar invitación desde el link del correo ([token].tsx)
  async aceptarInvitacion(token: string) {
    return postJSON<{
      ok: boolean;
      invitacion: {
        token: string;
        contacto_id: number;
        nombre_contacto: string;
        email_contacto: string;
        paciente_id: number;
      };
    }>(`/contactos-apoyo/aceptar/${token}`, {});
  },

  // 3) Vincular invitación al usuario recién registrado
  async vincularInvitacion(data: { token: string; contacto_usuario_id: number }) {
    return postJSON<{ msg: string }>("/contactos-apoyo/vincular", data);
  },

  // 4) Listar pacientes de un contacto (modo "amigo")
  async misPacientes() {
    const contacto_usuario_id = await getCurrentUserId();
    if (!contacto_usuario_id) throw new Error("No hay sesión activa.");

    return postJSON<
      Array<{
        contacto_id: number;
        usuario_id: number; // id del paciente
        nombre_paciente: string;
      }>
    >("/contactos-apoyo/mis-pacientes", { contacto_usuario_id });
  },

  // 5) Verificar que este contacto puede ver a un paciente concreto
  async verificarAcceso(paciente_id: number | string) {
    const contacto_usuario_id = await getCurrentUserId();
    if (!contacto_usuario_id) throw new Error("No hay sesión activa.");

    return getJSON<{ msg: string }>(
      `/contactos-apoyo/verificar/${paciente_id}?contacto_usuario_id=${contacto_usuario_id}`
    );
  },

  // 6) Ver TODAS las invitaciones enviadas por el paciente
  async listarInvitacionesEnviadas() {
    const usuario_id = await getCurrentUserId();
    if (!usuario_id) throw new Error("No hay sesión activa.");

    return getJSON<
      Array<{
        contacto_id: number;
        nombre_contacto: string;
        email_contacto: string;
        telefono_contacto: string | null;
        tipo_contacto: string;
        prioridad: number;
        habilitado: number;
        estado_invitacion: string;
        contacto_usuario_id: number | null;
        fecha_creacion: string;
      }>
    >(`/contactos-apoyo/invitaciones/${usuario_id}`);
  },

  // 7) Ver solo los contactos de apoyo aceptados del paciente
  async listarMisContactos() {
    const usuario_id = await getCurrentUserId();
    if (!usuario_id) throw new Error("No hay sesión activa.");

    return getJSON<
      Array<{
        contacto_id: number;
        nombre_contacto: string;
        email_contacto: string;
        telefono_contacto: string | null;
        tipo_contacto: string;
        prioridad: number;
        habilitado: number;
        estado_invitacion: string;
        contacto_usuario_id: number | null;
      }>
    >(`/contactos-apoyo/mis-contactos/${usuario_id}`);
  },

  // 8) Eliminar un contacto de apoyo (aceptado)
  async eliminarContacto(contacto_id: number) {
    const res = await fetch(
      `${BASE_URL}/contactos-apoyo/mis-contactos/${contacto_id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      const fallback =
        (data && (data.mensaje || data.error || data.msg)) || "";
      const txt = fallback || (await res.text().catch(() => ""));
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
    }

    return data as { msg?: string };
  },

  // 9) Eliminar una invitación enviada (pendiente / rechazada)
  async eliminarInvitacion(contacto_id: number) {
    const res = await fetch(
      `${BASE_URL}/contactos-apoyo/invitaciones/${contacto_id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    let data: any = null;
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      const fallback =
        (data && (data.mensaje || data.error || data.msg)) || "";
      const txt = fallback || (await res.text().catch(() => ""));
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
    }

    return data as { msg?: string };
  },
};

/* =========================
   API MONITOREO SENSOR
   ========================= */

export const monitoreoApi = {
  async iniciar() {
    const uid = await getCurrentUserId();
    if (!uid) throw new Error("No hay usuario en sesión.");

    // 👇 Solo pedimos UNA lectura al backend. Nada de intervalos aquí.
    return postJSON<{ mensaje?: string }>(
      "/niveles-glucosa/monitoreo/iniciar",
      { usuarioId: uid }
    );
  },

  async detener() {
    const uid = await getCurrentUserId();
    if (!uid) return; // si no hay sesión, no hacemos nada

    try {
      return await postJSON<{ mensaje?: string }>(
        "/niveles-glucosa/monitoreo/detener",
        { usuarioId: uid }
      );
    } catch (e) {
      console.warn("No se pudo detener monitoreo:", e);
    }
  },
};
