// src/modulos/types/glucose.ts

// Lo que ENVÍAS al backend (ingesta)
// OJO: en tu backend muchos campos son opcionales o tienen default.
// Por eso aquí los dejamos opcionales. Además, "usuario_id" lo
// completamos desde sesión en el api, así que también es opcional.
export type GlucoseCreateRequest = {
  usuario_id?: number; // lo inyecta glucoseApi.create()
  valor_glucosa: number;
  unidad?: "mg/dL" | "mmol/L";
  metodo_registro?: "manual" | "sensor";
  origen_sensor?: string | null;
  fecha_registro?: string; // ISO (opcional, el back pone new Date() si no envías)
  etiquetado?:
    | "ayunas"
    | "pre_comida"
    | "post_comida"
    | "antes_de_dormir"
    | "control_aleatorio"
    | string
    | null;
  notas?: string | null;
  registrado_por?: number | null;
};

// Lo que DEVUELVE el backend (modelo nivelesglucosa)
export type Glucose = {
  glucosa_id: number;
  usuario_id: number;
  valor_glucosa: number;
  unidad: "mg/dL" | "mmol/L";
  metodo_registro: string;
  origen_sensor: string | null;
  fecha_registro: string; // ISO
  etiquetado: string | null;
  notas: string | null;
  registrado_por: number | null;
};
