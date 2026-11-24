/*
# Proteger vínculos de empleado y gerencia en perfiles

Solo el administrador puede cambiar el empleado o la gerencia asignada a un perfil.
Esto evita que usuarios regulares se auto-asignen permisos.
*/

CREATE OR REPLACE FUNCTION public.perfil_proteger_vinculos()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND (NEW.empleado_id IS DISTINCT FROM OLD.empleado_id OR NEW.gerencia_id IS DISTINCT FROM OLD.gerencia_id) THEN
    RAISE EXCEPTION 'Solo el administrador puede cambiar el empleado o la línea asignada';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_perfil_proteger ON public.profiles;
CREATE TRIGGER trg_perfil_proteger BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.perfil_proteger_vinculos();
