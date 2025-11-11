export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  nombre: string;
  email: string;
  password: string;
  apellido?: string;   
  fecha_nacimiento?: string;
  tipo_diabetes?: "tipo1" | "tipo2" | null;
  telefono?: string | null;
  rol?: "diabetico" | "admin" | "medico";
  tiene_sensor?: boolean;
};

export type AuthResponse = {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    fecha_registro: string;
    tieneSensor?: boolean;
  };
};

export type User = {
  id: number;
  nombre: string;
  email: string;
  fecha_registro: string;
  tipo_diabetes?: string | null;
};