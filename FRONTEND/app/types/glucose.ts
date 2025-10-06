export type GlucoseCreateRequest = {
  usuario_id: number;
  valor_glucosa: number;
  unidad: "mg/dL";
  metodo_registro: "manual";
  origen_sensor: string | null;
  fecha_registro: string; // ISO
  etiquetado: string | null;
  notas: string | null;
  registrado_por: number;
};

export type Glucose = {
  id?: number;
  valor_glucosa: number;
  unidad: "mg/dL";
  fecha_registro: string;
  notas?: string | null;
};
