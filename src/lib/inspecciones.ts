export type GerenciaInsp = "logistica" | "calidad" | "shi" | "sms";
export const GERENCIAS_INSP: { key: GerenciaInsp; label: string }[] = [
  { key: "logistica", label: "Logística" },
  { key: "calidad", label: "Calidad" },
  { key: "shi", label: "SHI" },
  { key: "sms", label: "SMS" },
];

export type EstadoVerif = "pendiente" | "revision" | "aprobada" | "detenida" | "no_aplica";
export const ESTADO_VERIF_LABEL: Record<EstadoVerif, string> = {
  pendiente: "Pendiente",
  revision: "En revisión",
  aprobada: "Aprobada",
  detenida: "Detenida",
  no_aplica: "No aplica",
};

/** Estructura EANSA de 16 ítems (sub-ítems vacíos = el ítem se llena directo). */
export const CALIDAD_ITEMS: { n: number; titulo: string; subs: string[] }[] = [
  { n: 1, titulo: "Plan de calidad", subs: [] },
  { n: 2, titulo: "Matriz de riesgos y oportunidades", subs: [] },
  { n: 3, titulo: "Matriz de trazabilidad de requisitos", subs: [] },
  { n: 4, titulo: "Planificación del diseño y desarrollo", subs: [] },
  { n: 5, titulo: "Dossier de diseño", subs: ["Conjunto de planos", "Cálculos de ingeniería, simulaciones", "Informe de diseño"] },
  { n: 6, titulo: "Paquete de datos técnicos (TDP)", subs: ["Planos de ingeniería (cotas, tolerancias y acabados)", "Modelos 3D (archivos CAD)", "Listas de materiales (BOM)", "Especificaciones técnicas (materiales, tratamientos, acabados)"] },
  { n: 7, titulo: "Paquete de datos de fabricación (FDP)", subs: ["Hojas de ruta", "Hojas de proceso", "Maquinarias y equipos", "Diseño de herramentales", "Prototipo"] },
  { n: 8, titulo: "Informes de revisión de diseño", subs: ["Diseño conceptual", "Diseño preliminar (PDR)", "Diseño detallado (CDR)"] },
  { n: 9, titulo: "Plan de inspección y ensayo (PIE / ITP)", subs: ["Inspección de condición", "Inspección de materia prima", "Inspección en proceso", "Inspección final", "Inspección preembarque", "Inspección de pruebas", "Inspección de servicio"] },
  { n: 10, titulo: "Lista de chequeo de control de calidad", subs: [] },
  { n: 11, titulo: "Proveedores críticos y certificados de materiales", subs: ["Listado de proveedores críticos aprobados", "Certificados de calidad de materiales"] },
  { n: 12, titulo: "Protocolos e informes de pruebas", subs: ["Protocolos de pruebas", "Informes de resultados de pruebas"] },
  { n: 13, titulo: "Certificado de liberación o conformidad (CoC)", subs: [] },
  { n: 14, titulo: "No conformidades y acciones correctivas (NCR / CAPA)", subs: ["Registro de hallazgos", "Reporte y tratamiento de no conformidades"] },
  { n: 15, titulo: "Manuales / documentación técnica", subs: ["Manual de usuario", "Manual de operaciones", "Manual de mantenimiento", "Bitácoras", "Listas de chequeo", "Otros documentos"] },
  { n: 16, titulo: "Auditorías", subs: [] },
];

export const CONFORMIDADES = ["Pendiente", "En evaluación", "Conforme", "No conforme", "No aplica"] as const;

/** Consolida la conformidad de un ítem a partir de sus sub-ítems. */
export function consolidar(valores: string[]): string {
  const v = valores.filter((x) => x !== "No aplica");
  if (valores.length && !v.length) return "No aplica";
  if (v.includes("No conforme")) return "No conforme";
  if (v.length && v.every((x) => x === "Conforme")) return "Conforme";
  if (v.some((x) => x === "Conforme" || x === "En evaluación")) return "En evaluación";
  return "Pendiente";
}

export type ShiTipo = "ats" | "altura" | "caliente" | "confinado" | "electrico";
export const SHI_DOCS: { tipo: ShiTipo; titulo: string; codigo: string; checks: string[] }[] = [
  {
    tipo: "ats", titulo: "Análisis de Trabajo Seguro (ATS)", codigo: "FOR-HSI-ATS-01",
    checks: ["Personal informado de los riesgos del trabajo", "Área inspeccionada y señalizada", "Herramientas y equipos en buen estado", "EPP verificado en todos los trabajadores", "Plan de emergencia conocido por la cuadrilla"],
  },
  {
    tipo: "altura", titulo: "Permiso de trabajo en altura", codigo: "PETA",
    checks: ["Trabajo a más de 1,80 m", "Arnés de cuerpo completo inspeccionado", "Punto de anclaje certificado (5.000 lb)", "Línea de vida / doble eslinga con absorbedor", "Andamio o escalera inspeccionada y etiquetada", "Área inferior acordonada", "Plan de rescate disponible"],
  },
  {
    tipo: "caliente", titulo: "Permiso de trabajo en caliente", codigo: "PETC",
    checks: ["Radio de 11 m libre de combustibles", "Medición de gases (O2 / LEL / CO / H2S) aceptable", "Extintor en sitio", "Vigía de fuego asignado", "Mantas ignífugas / protección de áreas", "Retén de fuego 30–60 min tras finalizar"],
  },
  {
    tipo: "confinado", titulo: "Permiso de trabajo en espacio confinado", codigo: "PETEC",
    checks: ["Bloqueo y etiquetado (LOTO) de energías", "Ventilación forzada instalada", "Monitoreo continuo de atmósfera", "Vigía en la entrada", "Trípode y equipo de rescate", "Bitácora de entradas y salidas"],
  },
  {
    tipo: "electrico", titulo: "Permiso de trabajo eléctrico", codigo: "PETE",
    checks: ["Corte efectivo de todas las fuentes", "Bloqueo y etiquetado (LOTO)", "Verificación de ausencia de tensión", "Puesta a tierra y en cortocircuito", "Señalización de la zona de trabajo", "EPP para arco eléctrico (Arc Flash)"],
  },
];
