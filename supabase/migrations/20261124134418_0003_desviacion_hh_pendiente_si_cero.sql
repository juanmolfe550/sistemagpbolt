/*
# Desviación HH: pendiente si horas ejecutadas son cero

Cambia la expresión de desviacion_hh en OP y OT para que solo calcule
cuando hh_ejecutadas > 0 (no cuando es null o cero).
*/

ALTER TABLE public.ordenes_produccion ALTER COLUMN desviacion_hh SET EXPRESSION AS (CASE WHEN hh_planificadas > 0 AND hh_ejecutadas > 0 THEN round((hh_ejecutadas - hh_planificadas) / hh_planificadas * 100, 2) END);
ALTER TABLE public.ordenes_trabajo ALTER COLUMN desviacion_hh SET EXPRESSION AS (CASE WHEN hh_planificadas > 0 AND hh_ejecutadas > 0 THEN round((hh_ejecutadas - hh_planificadas) / hh_planificadas * 100, 2) END);
