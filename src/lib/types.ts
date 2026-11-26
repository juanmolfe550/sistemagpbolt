export type AppRole =
  | "admin"
  | "supervisor"
  | "operario"
  | "calidad"
  | "shi"
  | "sms"
  | "logistica"
  | "lider_proyecto";

export interface Profile {
  id: string;
  nombre: string | null;
  email: string | null;
  created_at: string;
  gerencia_id: number | null;
  empleado_id: number | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface AuthSession {
  user: Profile | null;
  roles: AppRole[];
  loading: boolean;
}

export interface Gerencia {
  id: number;
  nombre: string;
  responsable: string | null;
  responsable_id: number | null;
  siglas: string | null;
  tipo: string | null;
  activo: boolean;
  observaciones: string | null;
}

export interface Cliente {
  id: number;
  nombre: string;
  rif: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
}

export interface Empleado {
  id: number;
  nombre_completo: string;
  cedula: string | null;
  cargo: string | null;
  gerencia_id: number | null;
  correo: string | null;
  telefono: string | null;
  activo: boolean;
}

export interface TipoProduccion {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface EstadoOp {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface EstadoOt {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface OrdenProduccion {
  id: number;
  numero: string;
  fecha: string;
  cliente_id: number;
  tipo_produccion_id: number | null;
  producto: string;
  descripcion: string | null;
  especificaciones: string | null;
  cantidad: number;
  unidad_medida: string | null;
  tiempo_entrega: string | null;
  fecha_compromiso: string | null;
  costo_fabricacion: number | null;
  documentacion_referencia: string | null;
  prioridad: string | null;
  estado_id: number | null;
  gerencia_id: number | null;
  responsable_id: number | null;
  revision: string | null;
  fecha_ultimo_cambio: string | null;
  motivo_cambio: string | null;
  fecha_asignacion: string | null;
  fecha_inicio_plan: string | null;
  fecha_fin_plan: string | null;
  avance: number;
  hh_planificadas: number;
  hh_ejecutadas: number;
  requisitos: string | null;
  no_conformidad: boolean;
  identificacion_no_conformidad: string | null;
  tratamiento: string | null;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  created_at: string;
  desviacion_hh: number | null;
  desviacion_dias: number | null;
  tiempo_entrega_dias: number | null;
  plan_congelada: boolean;
  plan_firma_nombre: string | null;
  plan_firma_cargo: string | null;
  plan_firma_fecha: string | null;
  plan_firma_codigo: string | null;
}

export interface OrdenTrabajo {
  id: number;
  numero: string;
  op_id: number;
  revision: string | null;
  objeto: string | null;
  descripcion: string | null;
  especificaciones: string | null;
  cantidad: number | null;
  unidad_medida: string | null;
  documentacion_referencia: string | null;
  gerencia_id: number | null;
  responsable_id: number | null;
  fecha_elaboracion: string | null;
  fecha_asignacion: string | null;
  fecha_inicio_plan: string | null;
  fecha_fin_plan: string | null;
  hh_planificadas: number;
  prioridad: string | null;
  tiene_dependencia: boolean;
  estado_id: number | null;
  hh_ejecutadas: number;
  avance: number;
  fecha_inicio_real: string | null;
  fecha_fin_real: string | null;
  resultado_ejecucion: string | null;
  no_programada: boolean;
  no_conformidad: boolean;
  tipo_restriccion: string | null;
  tratamiento_no_conformidad: string | null;
  accion_requerida: string | null;
  responsable_accion_id: number | null;
  fecha_compromiso_accion: string | null;
  requisitos: string | null;
  observaciones: string | null;
  created_at: string;
  depende_de_ot_id: number | null;
  cantidad_ejecutada: number;
  requiere_ats: boolean;
  justificacion_no_programada: string | null;
  desviacion_hh: number | null;
  desviacion_dias: number | null;
  tiempo_entrega_dias: number | null;
}

export interface OtBitacora {
  id: number;
  ot_id: number;
  tipo: string;
  piezas: number;
  hh: number;
  nota: string | null;
  usuario_id: string | null;
  fecha: string;
}

export interface Verificacion {
  id: number;
  ot_id: number;
  gerencia: string;
  estado: string;
  severidad: string | null;
  observaciones: string | null;
  firma_nombre: string | null;
  firma_cargo: string | null;
  firma_fecha: string | null;
  firma_codigo: string | null;
  usuario_id: string | null;
  updated_at: string;
}

export interface CalidadRegistro {
  id: number;
  tipo: string;
  orden_id: number;
  item: number;
  sub: number;
  cantidad: number | null;
  conformidad: string;
  inicio: string | null;
  cierre: string | null;
  observaciones: string | null;
  registro: string | null;
  updated_by: string | null;
  updated_at: string;
  descripcion: string | null;
}

export interface ShiDocumento {
  id: number;
  ot_id: number;
  tipo: string;
  datos: Record<string, unknown>;
  estado: string;
  firma_nombre: string | null;
  firma_cargo: string | null;
  firma_fecha: string | null;
  firma_codigo: string | null;
  updated_at: string;
}
