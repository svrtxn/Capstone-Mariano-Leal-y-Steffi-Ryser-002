import { BASE_URL } from "../../constants/config";
import type { GlucoseCreateRequest, Glucose } from "../types/glucose";

async function postJSON<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${txt}`);
  }
  return res.json() as Promise<T>;
}

export const glucoseApi = {
  create(payload: GlucoseCreateRequest) {
    return postJSON<Glucose>("/api/niveles-glucosa", payload);
  },
};
