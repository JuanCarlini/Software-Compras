-- Migración: Agregar relación con items en líneas de orden de compra
-- Fecha: 2025-11-19
-- Descripción: Vincula las líneas de OC con el catálogo de items, manteniendo compatibilidad con el campo descripción actual

-- Agregar columna item_id a gu_lineasdeordenesdecompra
ALTER TABLE public.gu_lineasdeordenesdecompra
ADD COLUMN IF NOT EXISTS item_id BIGINT;

-- Agregar foreign key constraint
ALTER TABLE public.gu_lineasdeordenesdecompra
ADD CONSTRAINT fk_loc_item 
FOREIGN KEY (item_id) REFERENCES public.gu_items(id);

-- Crear índice para optimizar joins
CREATE INDEX IF NOT EXISTS idx_loc_item ON public.gu_lineasdeordenesdecompra (item_id);

-- Comentarios para documentación
COMMENT ON COLUMN public.gu_lineasdeordenesdecompra.item_id IS 'ID del item del catálogo. Si está presente, se usa la información del item. Si es NULL, se usa el campo descripción directamente (modo legacy).';
COMMENT ON COLUMN public.gu_lineasdeordenesdecompra.descripcion IS 'Descripción del producto/servicio. Se mantiene para: 1) Compatibilidad con OCs existentes, 2) Permitir items personalizados sin estar en el catálogo.';

-- Nota sobre lógica de negocio:
-- Si item_id está presente:
--   - El nombre viene de gu_items.nombre
--   - El precio se sugiere desde gu_items.precio_sugerido pero puede ser editado
--   - La descripción puede complementar la información del item
-- Si item_id es NULL:
--   - Se usa el modo legacy: descripción como texto libre
--   - Permite items personalizados que no están en el catálogo
