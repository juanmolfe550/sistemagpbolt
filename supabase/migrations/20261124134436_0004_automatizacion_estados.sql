/*
# Automatización de estados de OT

1. Dependencia entre OT
- Añade depende_de_ot_id a ordenes_trabajo para indicar que una OT depende de otra

2. Funciones helper
- estado_ot_id(nombre) y estado_op_id(nombre) para buscar IDs de estado por nombre
- ot_dependencia_pendiente(dep) verifica si la OT dependiente no está terminada

3. Motor de estados
- ot_antes_guardar: asigna estado inicial según estado de la OP, valida permisos,
  bloquea OT liberadas con dependencia pendiente
- ot_despues_guardar: actualiza OP a "En producción" cuando OT pasa a ejecución,
  libera OTs que dependían de una recién terminada, marca OP como Completada
  cuando todas sus OTs están cerradas
- op_despues_guardar: libera OTs cuando OP pasa a "Emitida"

4. Triggers
- trg_ot_antes_guardar (BEFORE INSERT/UPDATE)
- trg_ot_despues_guardar (AFTER INSERT/UPDATE)
- trg_op_despues_guardar (AFTER UPDATE)
*/

ALTER TABLE public.ordenes_trabajo ADD COLUMN IF NOT EXISTS depende_de_ot_id bigint REFERENCES public.ordenes_trabajo(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.ordenes_trabajo.tiene_dependencia IS 'DEPRECATED: replaced by depende_de_ot_id';

CREATE OR REPLACE FUNCTION public.estado_ot_id(_n text) RETURNS bigint LANGUAGE sql STABLE SET search_path=public AS $$ SELECT id FROM estados_ot WHERE lower(nombre)=lower(_n) LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.estado_op_id(_n text) RETURNS bigint LANGUAGE sql STABLE SET search_path=public AS $$ SELECT id FROM estados_op WHERE lower(nombre)=lower(_n) LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.ot_dependencia_pendiente(_dep bigint) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT _dep IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ordenes_trabajo WHERE id=_dep AND estado_id IN (estado_ot_id('Terminada'), estado_ot_id('Cerrada')))
$$;

CREATE OR REPLACE FUNCTION public.ot_antes_guardar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE op_estado text;
BEGIN
  SELECT e.nombre INTO op_estado FROM ordenes_produccion o LEFT JOIN estados_op e ON e.id=o.estado_id WHERE o.id=NEW.op_id;
  IF TG_OP='INSERT' THEN
    IF op_estado='Planificada' THEN NEW.estado_id := estado_ot_id('Creada');
    ELSIF op_estado IN ('Emitida','En producción') THEN
      NEW.estado_id := CASE WHEN ot_dependencia_pendiente(NEW.depende_de_ot_id) THEN estado_ot_id('En espera/Bloqueada') ELSE estado_ot_id('Liberada') END;
    ELSIF NEW.estado_id IS NULL THEN NEW.estado_id := estado_ot_id('Creada');
    END IF;
    RETURN NEW;
  END IF;
  IF pg_trigger_depth()=1 AND auth.uid() IS NOT NULL AND NEW.estado_id IS DISTINCT FROM OLD.estado_id
     AND NOT has_role(auth.uid(),'admin') THEN
    IF NEW.estado_id NOT IN (estado_ot_id('En ejecución'),estado_ot_id('En espera de material'),estado_ot_id('Bloqueada por Ingenieria'),estado_ot_id('Terminada')) THEN
      RAISE EXCEPTION 'Solo Gestión de la Producción puede asignar ese estado. Estados permitidos: En ejecución, En espera de material, Bloqueada por Ingeniería, Terminada.';
    END IF;
    IF NEW.estado_id = estado_ot_id('En ejecución') AND ot_dependencia_pendiente(NEW.depende_de_ot_id) THEN
      RAISE EXCEPTION 'Esta OT depende de otra OT que aún no está terminada.';
    END IF;
  END IF;
  IF NEW.depende_de_ot_id IS DISTINCT FROM OLD.depende_de_ot_id AND NEW.estado_id = estado_ot_id('Liberada') AND ot_dependencia_pendiente(NEW.depende_de_ot_id) THEN
    NEW.estado_id := estado_ot_id('En espera/Bloqueada');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.ot_despues_guardar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND NEW.estado_id IS DISTINCT FROM OLD.estado_id THEN RETURN NEW; END IF;
  IF NEW.estado_id = estado_ot_id('En ejecución') THEN
    UPDATE ordenes_produccion SET estado_id=estado_op_id('En producción')
     WHERE id=NEW.op_id AND estado_id IS DISTINCT FROM estado_op_id('En producción') AND estado_id IN (estado_op_id('Emitida'),estado_op_id('Planificada'));
  END IF;
  IF NEW.estado_id IN (estado_ot_id('Terminada'),estado_ot_id('Cerrada')) THEN
    UPDATE ordenes_trabajo SET estado_id=estado_ot_id('Liberada')
     WHERE depende_de_ot_id=NEW.id AND estado_id=estado_ot_id('En espera/Bloqueada');
  END IF;
  IF NEW.estado_id = estado_ot_id('Cerrada') AND NOT EXISTS (
       SELECT 1 FROM ordenes_trabajo WHERE op_id=NEW.op_id AND estado_id IS DISTINCT FROM estado_ot_id('Cerrada') AND estado_id IS DISTINCT FROM estado_ot_id('Cancelada')) THEN
    UPDATE ordenes_produccion SET estado_id=estado_op_id('Completada') WHERE id=NEW.op_id;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.op_despues_guardar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.estado_id IS DISTINCT FROM OLD.estado_id AND NEW.estado_id = estado_op_id('Emitida') THEN
    UPDATE ordenes_trabajo SET estado_id = CASE WHEN ot_dependencia_pendiente(depende_de_ot_id) THEN estado_ot_id('En espera/Bloqueada') ELSE estado_ot_id('Liberada') END
     WHERE op_id=NEW.id AND (estado_id IS NULL OR estado_id=estado_ot_id('Creada'));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ot_antes_guardar ON public.ordenes_trabajo;
CREATE TRIGGER trg_ot_antes_guardar BEFORE INSERT OR UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.ot_antes_guardar();
DROP TRIGGER IF EXISTS trg_ot_despues_guardar ON public.ordenes_trabajo;
CREATE TRIGGER trg_ot_despues_guardar AFTER INSERT OR UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.ot_despues_guardar();
DROP TRIGGER IF EXISTS trg_op_despues_guardar ON public.ordenes_produccion;
CREATE TRIGGER trg_op_despues_guardar AFTER UPDATE ON public.ordenes_produccion FOR EACH ROW EXECUTE FUNCTION public.op_despues_guardar();

REVOKE EXECUTE ON FUNCTION public.ot_dependencia_pendiente(bigint), public.ot_antes_guardar(), public.ot_despues_guardar(), public.op_despues_guardar() FROM anon, public;
