import { fmtDesviacionDias, fmtDesviacionHH, fmtTiempoEntrega } from "./calculos";
// Definición de las tablas del sistema (migradas desde Access) y sus campos de formulario.
export type FieldType = "text" | "textarea" | "number" | "date" | "bool" | "select" | "prioridad" | "calc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vals = any;

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  ref?: LookupTable; // para type "select"
  list?: boolean; // mostrar en la tabla
  group?: string;
  calc?: (v: Vals) => string; // campo calculado, solo lectura (no se guarda desde el formulario)
};

export type LookupTable =
  | "clientes"
  | "empleados"
  | "gerencias"
  | "tipos_produccion"
  | "estados_op"
  | "estados_ot"
  | "ordenes_produccion"
  | "ordenes_trabajo";

export const LOOKUP_LABEL: Record<LookupTable, string> = {
  clientes: "nombre",
  empleados: "nombre_completo",
  gerencias: "nombre",
  tipos_produccion: "nombre",
  estados_op: "nombre",
  estados_ot: "nombre",
  ordenes_produccion: "numero",
  ordenes_trabajo: "numero",
};

export const PRIORIDADES = ["baja", "media", "alta", "urgente"];

export type Catalogo = {
  table: string;
  title: string;
  singular: string;
  fields: Field[];
  order: string;
};

export const CATALOGOS: Record<string, Catalogo> = {
  clientes: {
    table: "clientes",
    title: "Clientes",
    singular: "cliente",
    order: "nombre",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true, list: true },
      { name: "rif", label: "RIF", type: "text", list: true },
      { name: "direccion", label: "Dirección", type: "text" },
      { name: "telefono", label: "Teléfono", type: "text", list: true },
      { name: "correo", label: "Correo", type: "text", list: true },
      { name: "activo", label: "Activo", type: "bool", list: true },
    ],
  },
  empleados: {
    table: "empleados",
    title: "Empleados",
    singular: "empleado",
    order: "nombre_completo",
    fields: [
      { name: "nombre_completo", label: "Nombre completo", type: "text", required: true, list: true },
      { name: "cedula", label: "Cédula", type: "text", list: true },
      { name: "cargo", label: "Cargo", type: "text", list: true },
      { name: "gerencia_id", label: "Gerencia / Proyecto", type: "select", ref: "gerencias", list: true },
      { name: "correo", label: "Correo", type: "text" },
      { name: "telefono", label: "Teléfono", type: "text" },
      { name: "activo", label: "Activo", type: "bool", list: true },
    ],
  },
  gerencias: {
    table: "gerencias",
    title: "Gerencias / Proyectos",
    singular: "gerencia o proyecto",
    order: "nombre",
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true, list: true },
      { name: "siglas", label: "Siglas", type: "text", list: true },
      { name: "responsable_id", label: "Responsable vigente", type: "select", ref: "empleados", list: true },
      { name: "tipo", label: "Tipo", type: "text", list: true },
      { name: "activo", label: "Activo", type: "bool", list: true },
      { name: "observaciones", label: "Observaciones", type: "textarea" },
    ],
  },
  "tipos-produccion": {
    table: "tipos_produccion",
    title: "Tipos de producción",
    singular: "tipo de producción",
    order: "id",
    fields: [
      { name: "nombre", label: "Tipo de producción", type: "text", required: true, list: true },
      { name: "activo", label: "Activo", type: "bool", list: true },
    ],
  },
  "estados-op": {
    table: "estados_op",
    title: "Estados de OP",
    singular: "estado de OP",
    order: "orden",
    fields: [
      { name: "orden", label: "Orden", type: "number", list: true },
      { name: "nombre", label: "Estado", type: "text", required: true, list: true },
      { name: "activo", label: "Activo", type: "bool", list: true },
    ],
  },
  "estados-ot": {
    table: "estados_ot",
    title: "Estados de OT",
    singular: "estado de OT",
    order: "orden",
    fields: [
      { name: "orden", label: "Orden", type: "number", list: true },
      { name: "nombre", label: "Estado", type: "text", required: true, list: true },
      { name: "activo", label: "Activo", type: "bool", list: true },
    ],
  },
};

export const OP_FIELDS: Field[] = [
  { name: "numero", label: "N° OP", type: "text", required: true, group: "General" },
  { name: "fecha", label: "Fecha de elaboración", type: "date", required: true, group: "General" },
  { name: "cliente_id", label: "Cliente", type: "select", ref: "clientes", required: true, group: "General" },
  { name: "tipo_produccion_id", label: "Tipo de producción", type: "select", ref: "tipos_produccion", group: "General" },
  { name: "producto", label: "Producto / Servicio", type: "text", required: true, group: "General" },
  { name: "cantidad", label: "Cantidad", type: "number", required: true, group: "General" },
  { name: "unidad_medida", label: "Unidad de medida", type: "text", group: "General" },
  { name: "prioridad", label: "Prioridad", type: "prioridad", group: "General" },
  { name: "estado_id", label: "Estado", type: "select", ref: "estados_op", group: "General" },
  { name: "gerencia_id", label: "Gerencia / Proyecto", type: "select", ref: "gerencias", group: "General" },
  { name: "responsable_id", label: "Responsable", type: "select", ref: "empleados", group: "General" },
  { name: "revision", label: "Revisión", type: "text", group: "General" },
  { name: "descripcion", label: "Descripción", type: "textarea", group: "Detalle" },
  { name: "especificaciones", label: "Especificaciones", type: "textarea", group: "Detalle" },
  { name: "requisitos", label: "Requisitos", type: "textarea", group: "Detalle" },
  { name: "documentacion_referencia", label: "Documentación de referencia", type: "textarea", group: "Detalle" },
  { name: "fecha_compromiso", label: "Fecha compromiso", type: "date", group: "Planificación" },
  { name: "fecha_asignacion", label: "Fecha asignación", type: "date", group: "Planificación" },
  { name: "fecha_inicio_plan", label: "Inicio planificado", type: "date", group: "Planificación" },
  { name: "fecha_fin_plan", label: "Fin planificado", type: "date", group: "Planificación" },
  { name: "fecha_inicio_real", label: "Inicio real", type: "date", group: "Planificación" },
  { name: "fecha_fin_real", label: "Fin real", type: "date", group: "Planificación" },
  { name: "hh_planificadas", label: "HH planificadas", type: "number", group: "Planificación" },
  { name: "hh_ejecutadas", label: "HH ejecutadas", type: "number", group: "Planificación" },
  { name: "avance", label: "% Avance", type: "number", group: "Planificación" },
  { name: "tiempo_entrega_dias", label: "Tiempo de entrega (calculado)", type: "calc", group: "Planificación", calc: (v) => fmtTiempoEntrega(v.fecha_inicio_plan, v.fecha_fin_plan) },
  { name: "desviacion_hh", label: "Desviación de HH (calculado)", type: "calc", group: "Planificación", calc: (v) => fmtDesviacionHH(v.hh_planificadas, v.hh_ejecutadas) },
  { name: "desviacion_dias", label: "Desviación de fechas (calculado)", type: "calc", group: "Planificación", calc: (v) => fmtDesviacionDias(v.fecha_fin_plan, v.fecha_fin_real) },
  { name: "costo_fabricacion", label: "Costo de fabricación", type: "number", group: "Planificación" },
  { name: "no_conformidad", label: "Hay no conformidad", type: "bool", group: "Calidad" },
  { name: "identificacion_no_conformidad", label: "Identificación de la no conformidad", type: "textarea", group: "Calidad" },
  { name: "tratamiento", label: "Tratamiento y correcciones", type: "textarea", group: "Calidad" },
  { name: "fecha_ultimo_cambio", label: "Fecha último cambio", type: "date", group: "Calidad" },
  { name: "motivo_cambio", label: "Motivo del cambio", type: "textarea", group: "Calidad" },
];

export const OT_FIELDS: Field[] = [
  { name: "numero", label: "N° OT", type: "text", required: true, group: "General" },
  { name: "op_id", label: "Orden de producción", type: "select", ref: "ordenes_produccion", required: true, group: "General" },
  { name: "objeto", label: "Objeto de la OT", type: "text", group: "General" },
  { name: "revision", label: "Revisión", type: "text", group: "General" },
  { name: "cantidad", label: "Cantidad", type: "number", group: "General" },
  { name: "unidad_medida", label: "Unidad de medida", type: "text", group: "General" },
  { name: "gerencia_id", label: "Gerencia / Proyecto", type: "select", ref: "gerencias", group: "General" },
  { name: "responsable_id", label: "Responsable", type: "select", ref: "empleados", group: "General" },
  { name: "prioridad", label: "Prioridad", type: "prioridad", group: "General" },
  { name: "estado_id", label: "Estado", type: "select", ref: "estados_ot", group: "General" },
  { name: "depende_de_ot_id", label: "Depende de la OT", type: "select", ref: "ordenes_trabajo", group: "General" },
  { name: "requiere_ats", label: "Requiere ATS / permisos SHI", type: "bool", group: "General" },
  { name: "no_programada", label: "No programada", type: "bool", group: "General" },
  { name: "descripcion", label: "Descripción", type: "textarea", group: "Detalle" },
  { name: "especificaciones", label: "Especificaciones", type: "textarea", group: "Detalle" },
  { name: "requisitos", label: "Requisitos", type: "textarea", group: "Detalle" },
  { name: "documentacion_referencia", label: "Documentación de referencia", type: "textarea", group: "Detalle" },
  { name: "fecha_elaboracion", label: "Fecha elaboración", type: "date", group: "Ejecución" },
  { name: "fecha_asignacion", label: "Fecha asignación", type: "date", group: "Ejecución" },
  { name: "fecha_inicio_plan", label: "Inicio planificado", type: "date", group: "Ejecución" },
  { name: "fecha_fin_plan", label: "Fin planificado", type: "date", group: "Ejecución" },
  { name: "fecha_inicio_real", label: "Inicio real", type: "date", group: "Ejecución" },
  { name: "fecha_fin_real", label: "Fin real", type: "date", group: "Ejecución" },
  { name: "hh_planificadas", label: "HH planificadas", type: "number", group: "Ejecución" },
  { name: "hh_ejecutadas", label: "HH ejecutadas", type: "number", group: "Ejecución" },
  { name: "avance", label: "% Avance", type: "number", group: "Ejecución" },
  { name: "tiempo_entrega_dias", label: "Tiempo de entrega (calculado)", type: "calc", group: "Ejecución", calc: (v) => fmtTiempoEntrega(v.fecha_inicio_plan, v.fecha_fin_plan) },
  { name: "desviacion_hh", label: "Desviación de HH (calculado)", type: "calc", group: "Ejecución", calc: (v) => fmtDesviacionHH(v.hh_planificadas, v.hh_ejecutadas) },
  { name: "desviacion_dias", label: "Desviación de fechas (calculado)", type: "calc", group: "Ejecución", calc: (v) => fmtDesviacionDias(v.fecha_fin_plan, v.fecha_fin_real) },
  { name: "resultado_ejecucion", label: "Resultado de la ejecución", type: "textarea", group: "Ejecución" },
  { name: "observaciones", label: "Observaciones", type: "textarea", group: "Ejecución" },
  { name: "no_conformidad", label: "Hay no conformidad", type: "bool", group: "Calidad" },
  { name: "tipo_restriccion", label: "Tipo de restricción", type: "textarea", group: "Calidad" },
  { name: "tratamiento_no_conformidad", label: "Tratamiento de la no conformidad", type: "textarea", group: "Calidad" },
  { name: "accion_requerida", label: "Acción requerida", type: "textarea", group: "Calidad" },
  { name: "responsable_accion_id", label: "Responsable de la acción", type: "select", ref: "empleados", group: "Calidad" },
  { name: "fecha_compromiso_accion", label: "Fecha compromiso de la acción", type: "date", group: "Calidad" },
];
