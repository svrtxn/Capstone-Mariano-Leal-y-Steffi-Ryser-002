// src/modulos/types/auth.ts
export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  nombre: string;
  email: string;
  password: string;
  fecha_nacimiento?: string;
  tipo_diabetes?: "tipo1" | "tipo2" | null;
  telefono?: string | null;
  rol?: "diabetico" | "admin" | "medico";
  tiene_sensor?: boolean;
  apellido?: string;
};

export type AuthResponse = {
  ok: boolean;
  mensaje?: string;
  token: string;
  usuario: {
    id: number;
    nombre: string;
    apellido?: string | null;
    correo: string;
    rol: "diabetico" | "admin" | "medico";
    tieneSensor: boolean;
  };
};
