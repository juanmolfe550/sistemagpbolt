/*
# Roles de inspección

Añade nuevos roles al sistema: calidad, shi, sms, logistica.
Estos roles corresponden a gerencias inspectoras que verifican OTs
antes de su cierre.
*/

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'calidad';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'shi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sms';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'logistica';
