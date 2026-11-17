export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      calidad_registros: {
        Row: {
          cantidad: number | null
          cierre: string | null
          conformidad: string
          descripcion: string | null
          id: number
          inicio: string | null
          item: number
          observaciones: string | null
          orden_id: number
          registro: string | null
          sub: number
          tipo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cantidad?: number | null
          cierre?: string | null
          conformidad?: string
          descripcion?: string | null
          id?: never
          inicio?: string | null
          item: number
          observaciones?: string | null
          orden_id: number
          registro?: string | null
          sub?: number
          tipo: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cantidad?: number | null
          cierre?: string | null
          conformidad?: string
          descripcion?: string | null
          id?: never
          inicio?: string | null
          item?: number
          observaciones?: string | null
          orden_id?: number
          registro?: string | null
          sub?: number
          tipo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean
          correo: string | null
          direccion: string | null
          id: number
          nombre: string
          rif: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          correo?: string | null
          direccion?: string | null
          id?: number
          nombre: string
          rif?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          correo?: string | null
          direccion?: string | null
          id?: number
          nombre?: string
          rif?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      empleados: {
        Row: {
          activo: boolean
          cargo: string | null
          cedula: string | null
          correo: string | null
          gerencia_id: number | null
          id: number
          nombre_completo: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          cargo?: string | null
          cedula?: string | null
          correo?: string | null
          gerencia_id?: number | null
          id?: number
          nombre_completo: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          cargo?: string | null
          cedula?: string | null
          correo?: string | null
          gerencia_id?: number | null
          id?: number
          nombre_completo?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empleados_gerencia_id_fkey"
            columns: ["gerencia_id"]
            isOneToOne: false
            referencedRelation: "gerencias"
            referencedColumns: ["id"]
          },
        ]
      }
      estados_op: {
        Row: {
          activo: boolean
          id: number
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          id?: number
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          id?: number
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      estados_ot: {
        Row: {
          activo: boolean
          id: number
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          id?: number
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          id?: number
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      gerencias: {
        Row: {
          activo: boolean
          id: number
          nombre: string
          observaciones: string | null
          responsable: string | null
          responsable_id: number | null
          siglas: string | null
          tipo: string | null
        }
        Insert: {
          activo?: boolean
          id?: number
          nombre: string
          observaciones?: string | null
          responsable?: string | null
          responsable_id?: number | null
          siglas?: string | null
          tipo?: string | null
        }
        Update: {
          activo?: boolean
          id?: number
          nombre?: string
          observaciones?: string | null
          responsable?: string | null
          responsable_id?: number | null
          siglas?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gerencias_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_responsable: {
        Row: {
          fecha: string
          gerencia_anterior_id: number | null
          gerencia_nueva_id: number | null
          id: number
          orden_id: number
          responsable_anterior_id: number | null
          responsable_nuevo_id: number | null
          tipo_orden: string
          usuario_id: string | null
        }
        Insert: {
          fecha?: string
          gerencia_anterior_id?: number | null
          gerencia_nueva_id?: number | null
          id?: never
          orden_id: number
          responsable_anterior_id?: number | null
          responsable_nuevo_id?: number | null
          tipo_orden: string
          usuario_id?: string | null
        }
        Update: {
          fecha?: string
          gerencia_anterior_id?: number | null
          gerencia_nueva_id?: number | null
          id?: never
          orden_id?: number
          responsable_anterior_id?: number | null
          responsable_nuevo_id?: number | null
          tipo_orden?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      ordenes_produccion: {
        Row: {
          avance: number
          cantidad: number
          cliente_id: number
          costo_fabricacion: number | null
          created_at: string
          descripcion: string | null
          desviacion_dias: number | null
          desviacion_hh: number | null
          documentacion_referencia: string | null
          especificaciones: string | null
          estado_id: number | null
          fecha: string
          fecha_asignacion: string | null
          fecha_compromiso: string | null
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio_plan: string | null
          fecha_inicio_real: string | null
          fecha_ultimo_cambio: string | null
          gerencia_id: number | null
          hh_ejecutadas: number
          hh_planificadas: number
          id: number
          identificacion_no_conformidad: string | null
          motivo_cambio: string | null
          no_conformidad: boolean
          numero: string
          plan_congelada: boolean
          plan_firma_cargo: string | null
          plan_firma_codigo: string | null
          plan_firma_fecha: string | null
          plan_firma_nombre: string | null
          prioridad: string | null
          producto: string
          requisitos: string | null
          responsable_id: number | null
          revision: string | null
          tiempo_entrega: string | null
          tiempo_entrega_dias: number | null
          tipo_produccion_id: number | null
          tratamiento: string | null
          unidad_medida: string | null
        }
        Insert: {
          avance?: number
          cantidad?: number
          cliente_id: number
          costo_fabricacion?: number | null
          created_at?: string
          descripcion?: string | null
          desviacion_dias?: number | null
          desviacion_hh?: number | null
          documentacion_referencia?: string | null
          especificaciones?: string | null
          estado_id?: number | null
          fecha?: string
          fecha_asignacion?: string | null
          fecha_compromiso?: string | null
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          fecha_ultimo_cambio?: string | null
          gerencia_id?: number | null
          hh_ejecutadas?: number
          hh_planificadas?: number
          id?: number
          identificacion_no_conformidad?: string | null
          motivo_cambio?: string | null
          no_conformidad?: boolean
          numero: string
          plan_congelada?: boolean
          plan_firma_cargo?: string | null
          plan_firma_codigo?: string | null
          plan_firma_fecha?: string | null
          plan_firma_nombre?: string | null
          prioridad?: string | null
          producto: string
          requisitos?: string | null
          responsable_id?: number | null
          revision?: string | null
          tiempo_entrega?: string | null
          tiempo_entrega_dias?: number | null
          tipo_produccion_id?: number | null
          tratamiento?: string | null
          unidad_medida?: string | null
        }
        Update: {
          avance?: number
          cantidad?: number
          cliente_id?: number
          costo_fabricacion?: number | null
          created_at?: string
          descripcion?: string | null
          desviacion_dias?: number | null
          desviacion_hh?: number | null
          documentacion_referencia?: string | null
          especificaciones?: string | null
          estado_id?: number | null
          fecha?: string
          fecha_asignacion?: string | null
          fecha_compromiso?: string | null
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          fecha_ultimo_cambio?: string | null
          gerencia_id?: number | null
          hh_ejecutadas?: number
          hh_planificadas?: number
          id?: number
          identificacion_no_conformidad?: string | null
          motivo_cambio?: string | null
          no_conformidad?: boolean
          numero?: string
          plan_congelada?: boolean
          plan_firma_cargo?: string | null
          plan_firma_codigo?: string | null
          plan_firma_fecha?: string | null
          plan_firma_nombre?: string | null
          prioridad?: string | null
          producto?: string
          requisitos?: string | null
          responsable_id?: number | null
          revision?: string | null
          tiempo_entrega?: string | null
          tiempo_entrega_dias?: number | null
          tipo_produccion_id?: number | null
          tratamiento?: string | null
          unidad_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_produccion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados_op"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_gerencia_id_fkey"
            columns: ["gerencia_id"]
            isOneToOne: false
            referencedRelation: "gerencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_produccion_tipo_produccion_id_fkey"
            columns: ["tipo_produccion_id"]
            isOneToOne: false
            referencedRelation: "tipos_produccion"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_trabajo: {
        Row: {
          accion_requerida: string | null
          avance: number
          cantidad: number | null
          cantidad_ejecutada: number
          created_at: string
          depende_de_ot_id: number | null
          descripcion: string | null
          desviacion_dias: number | null
          desviacion_hh: number | null
          documentacion_referencia: string | null
          especificaciones: string | null
          estado_id: number | null
          fecha_asignacion: string | null
          fecha_compromiso_accion: string | null
          fecha_elaboracion: string | null
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio_plan: string | null
          fecha_inicio_real: string | null
          gerencia_id: number | null
          hh_ejecutadas: number
          hh_planificadas: number
          id: number
          justificacion_no_programada: string | null
          no_conformidad: boolean
          no_programada: boolean
          numero: string
          objeto: string | null
          observaciones: string | null
          op_id: number
          prioridad: string | null
          requiere_ats: boolean
          requisitos: string | null
          responsable_accion_id: number | null
          responsable_id: number | null
          resultado_ejecucion: string | null
          revision: string | null
          tiempo_entrega_dias: number | null
          tiene_dependencia: boolean
          tipo_restriccion: string | null
          tratamiento_no_conformidad: string | null
          unidad_medida: string | null
        }
        Insert: {
          accion_requerida?: string | null
          avance?: number
          cantidad?: number | null
          cantidad_ejecutada?: number
          created_at?: string
          depende_de_ot_id?: number | null
          descripcion?: string | null
          desviacion_dias?: number | null
          desviacion_hh?: number | null
          documentacion_referencia?: string | null
          especificaciones?: string | null
          estado_id?: number | null
          fecha_asignacion?: string | null
          fecha_compromiso_accion?: string | null
          fecha_elaboracion?: string | null
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          gerencia_id?: number | null
          hh_ejecutadas?: number
          hh_planificadas?: number
          id?: number
          justificacion_no_programada?: string | null
          no_conformidad?: boolean
          no_programada?: boolean
          numero: string
          objeto?: string | null
          observaciones?: string | null
          op_id: number
          prioridad?: string | null
          requiere_ats?: boolean
          requisitos?: string | null
          responsable_accion_id?: number | null
          responsable_id?: number | null
          resultado_ejecucion?: string | null
          revision?: string | null
          tiempo_entrega_dias?: number | null
          tiene_dependencia?: boolean
          tipo_restriccion?: string | null
          tratamiento_no_conformidad?: string | null
          unidad_medida?: string | null
        }
        Update: {
          accion_requerida?: string | null
          avance?: number
          cantidad?: number | null
          cantidad_ejecutada?: number
          created_at?: string
          depende_de_ot_id?: number | null
          descripcion?: string | null
          desviacion_dias?: number | null
          desviacion_hh?: number | null
          documentacion_referencia?: string | null
          especificaciones?: string | null
          estado_id?: number | null
          fecha_asignacion?: string | null
          fecha_compromiso_accion?: string | null
          fecha_elaboracion?: string | null
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          gerencia_id?: number | null
          hh_ejecutadas?: number
          hh_planificadas?: number
          id?: number
          justificacion_no_programada?: string | null
          no_conformidad?: boolean
          no_programada?: boolean
          numero?: string
          objeto?: string | null
          observaciones?: string | null
          op_id?: number
          prioridad?: string | null
          requiere_ats?: boolean
          requisitos?: string | null
          responsable_accion_id?: number | null
          responsable_id?: number | null
          resultado_ejecucion?: string | null
          revision?: string | null
          tiempo_entrega_dias?: number | null
          tiene_dependencia?: boolean
          tipo_restriccion?: string | null
          tratamiento_no_conformidad?: string | null
          unidad_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_depende_de_ot_id_fkey"
            columns: ["depende_de_ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados_ot"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_gerencia_id_fkey"
            columns: ["gerencia_id"]
            isOneToOne: false
            referencedRelation: "gerencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_op_id_fkey"
            columns: ["op_id"]
            isOneToOne: false
            referencedRelation: "ordenes_produccion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_responsable_accion_id_fkey"
            columns: ["responsable_accion_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_bitacora: {
        Row: {
          fecha: string
          hh: number
          id: number
          nota: string | null
          ot_id: number
          piezas: number
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          fecha?: string
          hh?: number
          id?: number
          nota?: string | null
          ot_id: number
          piezas?: number
          tipo?: string
          usuario_id?: string | null
        }
        Update: {
          fecha?: string
          hh?: number
          id?: number
          nota?: string | null
          ot_id?: number
          piezas?: number
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ot_bitacora_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          empleado_id: number | null
          gerencia_id: number | null
          id: string
          nombre: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          empleado_id?: number | null
          gerencia_id?: number | null
          id: string
          nombre?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          empleado_id?: number | null
          gerencia_id?: number | null
          id?: string
          nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_gerencia_id_fkey"
            columns: ["gerencia_id"]
            isOneToOne: false
            referencedRelation: "gerencias"
            referencedColumns: ["id"]
          },
        ]
      }
      shi_documentos: {
        Row: {
          datos: Json
          estado: string
          firma_cargo: string | null
          firma_codigo: string | null
          firma_fecha: string | null
          firma_nombre: string | null
          id: number
          ot_id: number
          tipo: string
          updated_at: string
        }
        Insert: {
          datos?: Json
          estado?: string
          firma_cargo?: string | null
          firma_codigo?: string | null
          firma_fecha?: string | null
          firma_nombre?: string | null
          id?: never
          ot_id: number
          tipo: string
          updated_at?: string
        }
        Update: {
          datos?: Json
          estado?: string
          firma_cargo?: string | null
          firma_codigo?: string | null
          firma_fecha?: string | null
          firma_nombre?: string | null
          id?: never
          ot_id?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shi_documentos_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_produccion: {
        Row: {
          activo: boolean
          id: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          id?: number
          nombre: string
        }
        Update: {
          activo?: boolean
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verificaciones: {
        Row: {
          estado: string
          firma_cargo: string | null
          firma_codigo: string | null
          firma_fecha: string | null
          firma_nombre: string | null
          gerencia: string
          id: number
          observaciones: string | null
          ot_id: number
          severidad: string | null
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          estado?: string
          firma_cargo?: string | null
          firma_codigo?: string | null
          firma_fecha?: string | null
          firma_nombre?: string | null
          gerencia: string
          id?: never
          observaciones?: string | null
          ot_id: number
          severidad?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          estado?: string
          firma_cargo?: string | null
          firma_codigo?: string | null
          firma_fecha?: string | null
          firma_nombre?: string | null
          gerencia?: string
          id?: never
          observaciones?: string | null
          ot_id?: number
          severidad?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verificaciones_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
        ]
      }
      verificaciones_historial: {
        Row: {
          estado: string
          fecha: string
          gerencia: string
          id: number
          observaciones: string | null
          ot_id: number
          severidad: string | null
          usuario_id: string | null
          usuario_nombre: string | null
        }
        Insert: {
          estado: string
          fecha?: string
          gerencia: string
          id?: never
          observaciones?: string | null
          ot_id: number
          severidad?: string | null
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Update: {
          estado?: string
          fecha?: string
          gerencia?: string
          id?: never
          observaciones?: string | null
          ot_id?: number
          severidad?: string | null
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verificaciones_historial_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dias_habiles: { Args: { _fin: string; _ini: string }; Returns: number }
      es_lider_op: { Args: { _op: number; _uid: string }; Returns: boolean }
      estado_op_id: { Args: { _n: string }; Returns: number }
      estado_ot_id: { Args: { _n: string }; Returns: number }
      firma_de: { Args: { _uid: string }; Returns: Record<string, unknown> }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_editor: { Args: { _user_id: string }; Returns: boolean }
      op_congelada: { Args: { _op: number }; Returns: boolean }
      ot_dependencia_pendiente: { Args: { _dep: number }; Returns: boolean }
      reabrir_planificacion: { Args: { _op: number }; Returns: undefined }
      registrar_verificacion: {
        Args: {
          _estado: string
          _gerencia: string
          _obs?: string
          _ot: number
          _sev?: string
        }
        Returns: undefined
      }
      someter_planificacion: { Args: { _op: number }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin"
        | "supervisor"
        | "operario"
        | "calidad"
        | "shi"
        | "sms"
        | "logistica"
        | "lider_proyecto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "supervisor",
        "operario",
        "calidad",
        "shi",
        "sms",
        "logistica",
        "lider_proyecto",
      ],
    },
  },
} as const
