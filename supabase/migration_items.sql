-- Migración: Crear tabla gu_items para catálogo de productos/servicios
-- Fecha: 2025-11-19
-- Descripción: Sistema de items reutilizables para órdenes de compra

-- Tabla: gu_items (catálogo de productos y servicios)
CREATE TABLE IF NOT EXISTS public.gu_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_sugerido NUMERIC(12,2),
    unidad_medida VARCHAR(50),
    categoria VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_by BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_items_usuario FOREIGN KEY (created_by) REFERENCES public.gu_usuario(id)
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_items_nombre ON public.gu_items (nombre);
CREATE INDEX IF NOT EXISTS idx_items_active ON public.gu_items (is_active);
CREATE INDEX IF NOT EXISTS idx_items_categoria ON public.gu_items (categoria);

-- Índice de texto completo para búsqueda
CREATE INDEX IF NOT EXISTS idx_items_search ON public.gu_items USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')));

-- Comentarios para documentación
COMMENT ON TABLE public.gu_items IS 'Catálogo de items (productos/servicios) reutilizables para órdenes de compra. Permite estandarizar productos y mantener precios sugeridos.';
COMMENT ON COLUMN public.gu_items.nombre IS 'Nombre del producto o servicio';
COMMENT ON COLUMN public.gu_items.descripcion IS 'Descripción detallada del item';
COMMENT ON COLUMN public.gu_items.precio_sugerido IS 'Precio unitario sugerido (puede ser modificado en cada OC)';
COMMENT ON COLUMN public.gu_items.unidad_medida IS 'Unidad de medida (ej: kg, unidades, metros, horas, etc.)';
COMMENT ON COLUMN public.gu_items.categoria IS 'Categoría del item (ej: materiales, servicios, equipos, etc.)';
COMMENT ON COLUMN public.gu_items.is_active IS 'Indica si el item está activo. Los items inactivos no se muestran en los desplegables pero se mantienen para histórico.';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_gu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gu_items_updated_at
    BEFORE UPDATE ON public.gu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_gu_items_updated_at();
