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
};

export type AuthResponse = {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    fecha_registro: string;
  };
};

export type User = {
  id: number;
  nombre: string;
  email: string;
  fecha_registro: string;
  tipo_diabetes?: string | null;
};