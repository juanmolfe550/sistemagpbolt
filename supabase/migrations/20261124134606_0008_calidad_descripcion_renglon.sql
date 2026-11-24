/* Añade columna descripcion a calidad_registros */
ALTER TABLE public.calidad_registros ADD COLUMN IF NOT EXISTS descripcion text;
