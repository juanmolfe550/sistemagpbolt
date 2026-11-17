ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider_proyecto';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empleado_id bigint REFERENCES public.empleados(id);
ALTER TABLE public.ordenes_produccion
  ADD COLUMN IF NOT EXISTS plan_congelada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_firma_nombre text,
  ADD COLUMN IF NOT EXISTS plan_firma_cargo text,
  ADD COLUMN IF NOT EXISTS plan_firma_fecha timestamptz,
  ADD COLUMN IF NOT EXISTS plan_firma_codigo text;
ALTER TABLE public.ordenes_trabajo ADD COLUMN IF NOT EXISTS justificacion_no_programada text;

CREATE OR REPLACE FUNCTION public.es_lider_op(_uid uuid, _op bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    JOIN public.ordenes_produccion op ON op.responsable_id = p.empleado_id
    WHERE ur.user_id = _uid AND ur.role::text = 'lider_proyecto' AND op.id = _op)
$$;

CREATE OR REPLACE FUNCTION public.op_congelada(_op bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT plan_congelada FROM public.ordenes_produccion WHERE id = _op), false)
$$;

DROP POLICY IF EXISTS "crear" ON public.ordenes_trabajo;
CREATE POLICY "crear" ON public.ordenes_trabajo FOR INSERT TO authenticated
  WITH CHECK (is_editor(auth.uid()) OR (es_lider_op(auth.uid(), op_id) AND (NOT op_congelada(op_id) OR no_programada)));
DROP POLICY IF EXISTS "editar" ON public.ordenes_trabajo;
CREATE POLICY "editar" ON public.ordenes_trabajo FOR UPDATE TO authenticated
  USING (is_editor(auth.uid()) OR has_role(auth.uid(), 'operario'::app_role)
         OR (es_lider_op(auth.uid(), op_id) AND NOT op_congelada(op_id)));
DROP POLICY IF EXISTS "borrar" ON public.ordenes_trabajo;
CREATE POLICY "borrar" ON public.ordenes_trabajo FOR DELETE TO authenticated
  USING (is_editor(auth.uid()) OR (es_lider_op(auth.uid(), op_id) AND NOT op_congelada(op_id)));

-- OT creadas por el líder siempre nacen en Creada (solo Gestión de la Producción libera)
CREATE OR REPLACE FUNCTION public.ot_lider_forzar_creada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_editor(auth.uid()) AND es_lider_op(auth.uid(), NEW.op_id) THEN
    NEW.estado_id := estado_ot_id('Creada');
    IF op_congelada(NEW.op_id) THEN NEW.no_programada := true; END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ot_lider ON public.ordenes_trabajo;
CREATE TRIGGER trg_ot_lider BEFORE INSERT OR UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.ot_lider_forzar_creada();

CREATE OR REPLACE FUNCTION public.someter_planificacion(_op bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f record; num text; cod text;
BEGIN
  IF NOT (is_editor(auth.uid()) OR es_lider_op(auth.uid(), _op)) THEN RAISE EXCEPTION 'Sin permiso para planificar esta OP'; END IF;
  IF op_congelada(_op) THEN RAISE EXCEPTION 'La planificación ya fue sometida'; END IF;
  IF NOT EXISTS (SELECT 1 FROM ordenes_trabajo WHERE op_id = _op) THEN RAISE EXCEPTION 'Agregue al menos una OT antes de someter'; END IF;
  SELECT * INTO f FROM firma_de(auth.uid());
  SELECT numero INTO num FROM ordenes_produccion WHERE id = _op;
  cod := 'PLAN-' || num || '-' || upper(substr(md5(random()::text), 1, 6));
  UPDATE ordenes_produccion SET plan_congelada = true, plan_firma_nombre = f.nombre, plan_firma_cargo = f.cargo,
    plan_firma_fecha = now(), plan_firma_codigo = cod, estado_id = estado_op_id('Planificada') WHERE id = _op;
  RETURN cod;
END $$;
GRANT EXECUTE ON FUNCTION public.someter_planificacion(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.reabrir_planificacion(_op bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_editor(auth.uid()) THEN RAISE EXCEPTION 'Solo Gestión de la Producción puede reabrir la planificación'; END IF;
  UPDATE ordenes_produccion SET plan_congelada = false WHERE id = _op;
END $$;
GRANT EXECUTE ON FUNCTION public.reabrir_planificacion(bigint) TO authenticated;