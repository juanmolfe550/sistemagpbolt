// Cálculos de negocio de OP/OT. Los mismos cálculos existen en la base de datos
// (columnas calculadas desviacion_hh, desviacion_dias, tiempo_entrega_dias); aquí se usan
// para mostrar el resultado en vivo mientras se edita el formulario.
type Num = number | string | null | undefined;
type Fecha = string | null | undefined;

const toNum = (v: Num) => (v === null || v === undefined || v === "" ? null : Number(v));
const toDate = (v: Fecha) => (v ? new Date(`${String(v).slice(0, 10)}T00:00:00Z`) : null);

/** % de desviación de HH; null = no calculable (sin plan) o pendiente (sin ejecutadas). */
export function desviacionHH(plan: Num, ejec: Num): number | null {
  const p = toNum(plan);
  const e = toNum(ejec);
  // Las HH ejecutadas se guardan con 0 por defecto: 0 se trata como "aún no registradas".
  if (!p || p <= 0 || !e) return null;
  return Math.round(((e - p) / p) * 10000) / 100;
}

/** Días calendario entre fin real y fin planificado; null = pendiente. */
export function desviacionDias(finPlan: Fecha, finReal: Fecha): number | null {
  const a = toDate(finPlan);
  const b = toDate(finReal);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Días hábiles (lun-vie) incluyendo ambos extremos; null = pendiente; "error" si fin < inicio. */
export function diasHabiles(ini: Fecha, fin: Fecha): number | null | "error" {
  const a = toDate(ini);
  const b = toDate(fin);
  if (!a || !b) return null;
  if (b < a) return "error";
  let n = 0;
  for (const d = new Date(a); d <= b; d.setUTCDate(d.getUTCDate() + 1)) {
    const w = d.getUTCDay();
    if (w !== 0 && w !== 6) n++;
  }
  return n;
}

export const HORAS_JORNADA = 8;

export function fmtDesviacionHH(plan: Num, ejec: Num): string {
  if (!toNum(plan) || Number(plan) <= 0) return "No calculable";
  const d = desviacionHH(plan, ejec);
  if (d === null) return "Pendiente de cálculo";
  return `${d > 0 ? "+" : ""}${d.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function fmtDesviacionDias(finPlan: Fecha, finReal: Fecha): string {
  const d = desviacionDias(finPlan, finReal);
  if (d === null) return "Pendiente de cálculo";
  if (d === 0) return "0 días (a tiempo)";
  return `${d > 0 ? "+" : ""}${d} días ${d > 0 ? "(retraso)" : "(anticipada)"}`;
}

export function fmtTiempoEntrega(ini: Fecha, fin: Fecha): string {
  const d = diasHabiles(ini, fin);
  if (d === "error") return "Error: fin anterior al inicio";
  if (d === null) return "Pendiente";
  return `${d} días hábiles / ${d * HORAS_JORNADA} horas`;
}
