ALTER TABLE public.gerencias ADD COLUMN responsable_id bigint REFERENCES public.empleados(id) ON DELETE SET NULL;
UPDATE public.gerencias g SET responsable_id = e.id FROM public.empleados e
 WHERE g.responsable IS NOT NULL AND lower(trim(e.nombre_completo)) = lower(trim(g.responsable));
COMMENT ON COLUMN public.gerencias.responsable IS 'DEPRECATED: replaced by responsable_id';

CREATE OR REPLACE FUNCTION public.dias_habiles(_ini date, _fin date) RETURNS integer
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN _ini IS NULL OR _fin IS NULL OR _fin < _ini THEN NULL
  ELSE (SELECT count(*)::int FROM generate_series(_ini::timestamp, _fin::timestamp, interval '1 day') d WHERE extract(isodow FROM d) < 6) END
$$;

ALTER TABLE public.ordenes_produccion
  ADD COLUMN desviacion_hh numeric GENERATED ALWAYS AS (CASE WHEN hh_planificadas > 0 AND hh_ejecutadas IS NOT NULL THEN round((hh_ejecutadas - hh_planificadas) / hh_planificadas * 100, 2) END) STORED,
  ADD COLUMN desviacion_dias integer GENERATED ALWAYS AS (fecha_fin_real - fecha_fin_plan) STORED,
  ADD COLUMN tiempo_entrega_dias integer GENERATED ALWAYS AS (public.dias_habiles(fecha_inicio_plan, fecha_fin_plan)) STORED;
ALTER TABLE public.ordenes_trabajo
  ADD COLUMN desviacion_hh numeric GENERATED ALWAYS AS (CASE WHEN hh_planificadas > 0 AND hh_ejecutadas IS NOT NULL THEN round((hh_ejecutadas - hh_planificadas) / hh_planificadas * 100, 2) END) STORED,
  ADD COLUMN desviacion_dias integer GENERATED ALWAYS AS (fecha_fin_real - fecha_fin_plan) STORED,
  ADD COLUMN tiempo_entrega_dias integer GENERATED ALWAYS AS (public.dias_habiles(fecha_inicio_plan, fecha_fin_plan)) STORED;
COMMENT ON COLUMN public.ordenes_produccion.tiempo_entrega IS 'DEPRECATED: replaced by tiempo_entrega_dias (x8 = horas)';

CREATE OR REPLACE FUNCTION public.validar_fechas_plan() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.fecha_inicio_plan IS NOT NULL AND NEW.fecha_fin_plan IS NOT NULL AND NEW.fecha_fin_plan < NEW.fecha_inicio_plan THEN
    RAISE EXCEPTION 'La fecha fin planificada no puede ser anterior a la fecha de inicio planificada';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER op_validar_fechas BEFORE INSERT OR UPDATE ON public.ordenes_produccion FOR EACH ROW EXECUTE FUNCTION public.validar_fechas_plan();
CREATE TRIGGER ot_validar_fechas BEFORE INSERT OR UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.validar_fechas_plan();

CREATE TABLE public.historial_responsable (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo_orden text NOT NULL,
  orden_id bigint NOT NULL,
  gerencia_anterior_id bigint, gerencia_nueva_id bigint,
  responsable_anterior_id bigint, responsable_nuevo_id bigint,
  usuario_id uuid DEFAULT auth.uid(),
  fecha timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.historial_responsable TO authenticated;
GRANT ALL ON public.historial_responsable TO service_role;
ALTER TABLE public.historial_responsable ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer ON public.historial_responsable FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.registrar_cambio_responsable() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.responsable_id IS DISTINCT FROM OLD.responsable_id OR NEW.gerencia_id IS DISTINCT FROM OLD.gerencia_id THEN
    INSERT INTO public.historial_responsable(tipo_orden, orden_id, gerencia_anterior_id, gerencia_nueva_id, responsable_anterior_id, responsable_nuevo_id, usuario_id)
    VALUES (TG_ARGV[0], NEW.id, OLD.gerencia_id, NEW.gerencia_id, OLD.responsable_id, NEW.responsable_id, auth.uid());
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.registrar_cambio_responsable() FROM anon, public;
CREATE TRIGGER op_hist_resp AFTER UPDATE ON public.ordenes_produccion FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_responsable('OP');
CREATE TRIGGER ot_hist_resp AFTER UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_responsable('OT');