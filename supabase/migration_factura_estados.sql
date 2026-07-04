-- Script para actualizar el enum de estados de factura
-- EJECUTAR EN ESTE ORDEN:

-- 1. Crear el nuevo enum con un nombre temporal
CREATE TYPE public.factura_estado_new AS ENUM ('borrador','aprobado','rechazado','anulado');

-- 2. Agregar una columna temporal con el nuevo tipo
ALTER TABLE public.gu_facturas 
  ADD COLUMN estado_new public.factura_estado_new;

ALTER TABLE public.gu_lineasdefactura 
  ADD COLUMN estado_new public.factura_estado_new;

-- 3. Migrar los datos del estado antiguo al nuevo
UPDATE public.gu_facturas 
SET estado_new = CASE 
  WHEN estado::text = 'pendiente' THEN 'borrador'::public.factura_estado_new
  WHEN estado::text = 'pagada' THEN 'aprobado'::public.factura_estado_new
  WHEN estado::text = 'anulada' THEN 'anulado'::public.factura_estado_new
  ELSE 'borrador'::public.factura_estado_new
END;

UPDATE public.gu_lineasdefactura 
SET estado_new = CASE 
  WHEN estado::text = 'pendiente' THEN 'borrador'::public.factura_estado_new
  WHEN estado::text = 'pagada' THEN 'aprobado'::public.factura_estado_new
  WHEN estado::text = 'anulada' THEN 'anulado'::public.factura_estado_new
  ELSE 'borrador'::public.factura_estado_new
END;

-- 4. Eliminar la columna antigua
ALTER TABLE public.gu_facturas DROP COLUMN estado;
ALTER TABLE public.gu_lineasdefactura DROP COLUMN estado;

-- 5. Renombrar la columna nueva
ALTER TABLE public.gu_facturas RENAME COLUMN estado_new TO estado;
ALTER TABLE public.gu_lineasdefactura RENAME COLUMN estado_new TO estado;

-- 6. Establecer el default
ALTER TABLE public.gu_facturas 
  ALTER COLUMN estado SET DEFAULT 'borrador'::public.factura_estado_new;

ALTER TABLE public.gu_lineasdefactura 
  ALTER COLUMN estado SET DEFAULT 'borrador'::public.factura_estado_new;

-- 7. Eliminar el enum antiguo y renombrar el nuevo
DROP TYPE public.factura_estado;
ALTER TYPE public.factura_estado_new RENAME TO factura_estado;

-- Verificación
SELECT DISTINCT estado FROM public.gu_facturas;
SELECT DISTINCT estado FROM public.gu_lineasdefactura;
