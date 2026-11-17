INSERT INTO public.estados_ot (nombre, orden)
SELECT v.n, v.o FROM (VALUES ('Detenida por Calidad',20),('Detenida por SHI',21),('Detenida por SMS',22)) v(n,o)
WHERE NOT EXISTS (SELECT 1 FROM public.estados_ot e WHERE e.nombre=v.n);

ALTER TABLE public.ordenes_trabajo ADD COLUMN IF NOT EXISTS requiere_ats boolean NOT NULL DEFAULT false;

-- Firma/sello del usuario autenticado
CREATE OR REPLACE FUNCTION public.firma_de(_uid uuid, OUT nombre text, OUT cargo text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(e.nombre_completo, p.nombre, p.email), COALESCE(e.cargo, '')
  FROM profiles p LEFT JOIN empleados e ON lower(e.correo)=lower(p.email)
  WHERE p.id=_uid LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.firma_de(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.firma_de(uuid) TO authenticated;

-- ===== Verificaciones (compuertas) =====
CREATE TABLE public.verificaciones (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ot_id bigint NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  gerencia text NOT NULL CHECK (gerencia IN ('calidad','shi','sms','logistica')),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','revision','aprobada','detenida','no_aplica')),
  severidad text,
  observaciones text,
  firma_nombre text, firma_cargo text, firma_fecha timestamptz, firma_codigo text,
  usuario_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ot_id, gerencia)
);
GRANT SELECT ON public.verificaciones TO authenticated;
GRANT ALL ON public.verificaciones TO service_role;
ALTER TABLE public.verificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer ON public.verificaciones FOR SELECT TO authenticated USING (true);

CREATE TABLE public.verificaciones_historial (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ot_id bigint NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  gerencia text NOT NULL, estado text NOT NULL, severidad text, observaciones text,
  usuario_nombre text, usuario_id uuid, fecha timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.verificaciones_historial TO authenticated;
GRANT ALL ON public.verificaciones_historial TO service_role;
ALTER TABLE public.verificaciones_historial ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer ON public.verificaciones_historial FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.registrar_verificacion(_ot bigint, _gerencia text, _estado text, _obs text DEFAULT NULL, _sev text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); es_admin boolean; ant text; f record; num text; est_ot text; det text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  es_admin := has_role(uid,'admin');
  IF NOT es_admin AND NOT has_role(uid, _gerencia::app_role) THEN
    RAISE EXCEPTION 'Solo la gerencia % puede registrar esta verificación.', upper(_gerencia);
  END IF;
  IF _estado = 'no_aplica' AND NOT es_admin THEN RAISE EXCEPTION 'Solo Gestión de la Producción puede marcar "No aplica".'; END IF;
  IF _estado = 'detenida' AND _gerencia = 'logistica' THEN RAISE EXCEPTION 'Logística no tiene autoridad de parada.'; END IF;
  IF _estado = 'detenida' AND coalesce(trim(_obs),'') = '' THEN RAISE EXCEPTION 'Indica el motivo de la parada.'; END IF;

  SELECT o.numero, e.nombre INTO num, est_ot FROM ordenes_trabajo o LEFT JOIN estados_ot e ON e.id=o.estado_id WHERE o.id=_ot;
  IF num IS NULL THEN RAISE EXCEPTION 'OT no encontrada'; END IF;
  IF _estado = 'aprobada' AND est_ot LIKE 'Detenida por%' THEN RAISE EXCEPTION 'La OT está detenida. Levanta primero la parada.'; END IF;
  SELECT estado INTO ant FROM verificaciones WHERE ot_id=_ot AND gerencia=_gerencia;
  SELECT * INTO f FROM firma_de(uid);

  INSERT INTO verificaciones AS v (ot_id, gerencia, estado, severidad, observaciones, usuario_id, updated_at,
    firma_nombre, firma_cargo, firma_fecha, firma_codigo)
  VALUES (_ot, _gerencia, _estado, _sev, _obs, uid, now(),
    CASE WHEN _estado='aprobada' THEN f.nombre END, CASE WHEN _estado='aprobada' THEN f.cargo END,
    CASE WHEN _estado='aprobada' THEN now() END,
    CASE WHEN _estado='aprobada' THEN upper(left(_gerencia,3))||'-'||regexp_replace(num,'\s','','g')||'-'||upper(substr(md5(_ot::text||_gerencia||uid::text||now()::text),1,6)) END)
  ON CONFLICT (ot_id, gerencia) DO UPDATE SET estado=EXCLUDED.estado, severidad=EXCLUDED.severidad, observaciones=EXCLUDED.observaciones,
    usuario_id=EXCLUDED.usuario_id, updated_at=now(), firma_nombre=EXCLUDED.firma_nombre, firma_cargo=EXCLUDED.firma_cargo,
    firma_fecha=EXCLUDED.firma_fecha, firma_codigo=EXCLUDED.firma_codigo;

  INSERT INTO verificaciones_historial (ot_id, gerencia, estado, severidad, observaciones, usuario_nombre, usuario_id)
  VALUES (_ot, _gerencia, _estado, _sev, _obs, f.nombre, uid);

  det := 'Detenida por ' || CASE _gerencia WHEN 'calidad' THEN 'Calidad' WHEN 'shi' THEN 'SHI' ELSE 'SMS' END;
  PERFORM set_config('app.sistema','1',true);
  IF _estado = 'detenida' THEN
    UPDATE ordenes_trabajo SET estado_id = estado_ot_id(det) WHERE id=_ot;
    INSERT INTO ot_bitacora (ot_id, tipo, nota, usuario_id) VALUES (_ot, 'parada', det||': '||_obs, uid);
  ELSIF ant = 'detenida' AND est_ot = det THEN
    UPDATE ordenes_trabajo SET estado_id = estado_ot_id('En ejecución') WHERE id=_ot;
    INSERT INTO ot_bitacora (ot_id, tipo, nota, usuario_id) VALUES (_ot, 'reanudacion', 'Parada levantada por '||upper(_gerencia)||coalesce(': '||_obs,''), uid);
  END IF;
  PERFORM set_config('app.sistema','',true);
END $$;
REVOKE EXECUTE ON FUNCTION public.registrar_verificacion(bigint,text,text,text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.registrar_verificacion(bigint,text,text,text,text) TO authenticated;

-- ===== SHI: ATS y permisos =====
CREATE TABLE public.shi_documentos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ot_id bigint NOT NULL REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('ats','altura','caliente','confinado','electrico')),
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','aprobado','cerrado')),
  firma_nombre text, firma_cargo text, firma_fecha timestamptz, firma_codigo text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ot_id, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shi_documentos TO authenticated;
GRANT ALL ON public.shi_documentos TO service_role;
ALTER TABLE public.shi_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer ON public.shi_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY crear ON public.shi_documentos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'shi') OR has_role(auth.uid(),'admin'));
CREATE POLICY editar ON public.shi_documentos FOR UPDATE TO authenticated USING (has_role(auth.uid(),'shi') OR has_role(auth.uid(),'admin'));
CREATE POLICY borrar ON public.shi_documentos FOR DELETE TO authenticated USING ((has_role(auth.uid(),'shi') OR has_role(auth.uid(),'admin')) AND estado='borrador');

CREATE OR REPLACE FUNCTION public.shi_doc_firmar() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE f record; num text;
BEGIN
  NEW.updated_at := now();
  IF NEW.estado='aprobado' AND (TG_OP='INSERT' OR OLD.estado IS DISTINCT FROM 'aprobado') THEN
    SELECT * INTO f FROM firma_de(auth.uid());
    SELECT numero INTO num FROM ordenes_trabajo WHERE id=NEW.ot_id;
    NEW.firma_nombre := f.nombre; NEW.firma_cargo := f.cargo; NEW.firma_fecha := now();
    NEW.firma_codigo := 'SHI-'||upper(NEW.tipo)||'-'||regexp_replace(coalesce(num,''),'\s','','g')||'-'||upper(substr(md5(NEW.ot_id::text||NEW.tipo||now()::text),1,6));
  ELSIF NEW.estado='borrador' THEN
    NEW.firma_nombre := NULL; NEW.firma_cargo := NULL; NEW.firma_fecha := NULL; NEW.firma_codigo := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER shi_doc_firmar BEFORE INSERT OR UPDATE ON public.shi_documentos FOR EACH ROW EXECUTE FUNCTION public.shi_doc_firmar();

-- ===== Calidad: 16 ítems EANSA =====
CREATE TABLE public.calidad_registros (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('op','ot')),
  orden_id bigint NOT NULL,
  item integer NOT NULL,
  sub integer NOT NULL DEFAULT 0,
  cantidad numeric,
  conformidad text NOT NULL DEFAULT 'Pendiente' CHECK (conformidad IN ('Pendiente','En evaluación','Conforme','No conforme','No aplica')),
  inicio date, cierre date,
  observaciones text, registro text,
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, orden_id, item, sub)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calidad_registros TO authenticated;
GRANT ALL ON public.calidad_registros TO service_role;
ALTER TABLE public.calidad_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer ON public.calidad_registros FOR SELECT TO authenticated USING (true);
CREATE POLICY crear ON public.calidad_registros FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'calidad') OR has_role(auth.uid(),'admin'));
CREATE POLICY editar ON public.calidad_registros FOR UPDATE TO authenticated USING (has_role(auth.uid(),'calidad') OR has_role(auth.uid(),'admin'));
CREATE POLICY borrar ON public.calidad_registros FOR DELETE TO authenticated USING (has_role(auth.uid(),'calidad') OR has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.calidad_validar() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.inicio IS NOT NULL AND NEW.cierre IS NOT NULL AND NEW.cierre < NEW.inicio THEN
    RAISE EXCEPTION 'La fecha de cierre no puede ser anterior al inicio.';
  END IF;
  NEW.updated_at := now(); NEW.updated_by := auth.uid();
  RETURN NEW;
END $$;
CREATE TRIGGER calidad_validar BEFORE INSERT OR UPDATE ON public.calidad_registros FOR EACH ROW EXECUTE FUNCTION public.calidad_validar();

-- ===== Reglas de compuertas sobre la OT =====
CREATE OR REPLACE FUNCTION public.ot_compuertas() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ant text; nue text; faltan text;
BEGIN
  IF NEW.estado_id IS NOT DISTINCT FROM OLD.estado_id OR current_setting('app.sistema',true)='1' THEN RETURN NEW; END IF;
  SELECT nombre INTO ant FROM estados_ot WHERE id=OLD.estado_id;
  SELECT nombre INTO nue FROM estados_ot WHERE id=NEW.estado_id;
  IF ant LIKE 'Detenida por%' AND NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'OT % — solo la gerencia que la detuvo (o Gestión de la Producción) puede levantar la parada.', ant;
  END IF;
  IF nue LIKE 'Detenida por%' AND NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Las paradas se registran desde el módulo de la gerencia inspectora.';
  END IF;
  IF nue='En ejecución' AND NEW.requiere_ats AND NOT EXISTS (SELECT 1 FROM shi_documentos WHERE ot_id=NEW.id AND tipo='ats' AND estado IN ('aprobado','cerrado')) THEN
    RAISE EXCEPTION 'Esta OT requiere ATS aprobado por SHI antes de iniciar.';
  END IF;
  IF nue='Cerrada' THEN
    SELECT string_agg(upper(g),', ') INTO faltan FROM unnest(ARRAY['logistica','calidad','shi','sms']) g
    WHERE NOT EXISTS (SELECT 1 FROM verificaciones v WHERE v.ot_id=NEW.id AND v.gerencia=g AND v.estado IN ('aprobada','no_aplica'));
    IF faltan IS NOT NULL THEN RAISE EXCEPTION 'No se puede cerrar: faltan aprobaciones de %.', faltan; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER ot_compuertas BEFORE UPDATE ON public.ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION public.ot_compuertas();

-- El motor de estados respeta los cambios hechos por el sistema (paradas de inspección)
CREATE OR REPLACE FUNCTION public.ot_antes_guardar()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
     AND coalesce(current_setting('app.sistema',true),'')<>'1'
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
END $function$;