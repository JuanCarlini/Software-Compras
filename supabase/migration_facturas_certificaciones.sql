-- Script para agregar la tabla de relación entre facturas y certificaciones
-- Ejecutar este script en la base de datos existente

-- Tabla: gu_facturas_certificaciones (relación entre facturas y certificaciones)
CREATE TABLE IF NOT EXISTS public.gu_facturas_certificaciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    factura_id BIGINT NOT NULL,
    certificacion_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_factcert_fact FOREIGN KEY (factura_id) REFERENCES public.gu_facturas(id) ON DELETE CASCADE,
    CONSTRAINT fk_factcert_cert FOREIGN KEY (certificacion_id) REFERENCES public.gu_certificaciones(id),
    CONSTRAINT uq_factura_certificacion UNIQUE (factura_id, certificacion_id)
);

-- Índices para optimizar las búsquedas
CREATE INDEX IF NOT EXISTS idx_factcert_fact ON public.gu_facturas_certificaciones (factura_id);
CREATE INDEX IF NOT EXISTS idx_factcert_cert ON public.gu_facturas_certificaciones (certificacion_id);

-- Comentarios para documentación
COMMENT ON TABLE public.gu_facturas_certificaciones IS 'Tabla de relación muchos a muchos entre facturas y certificaciones. Permite asociar una o más certificaciones aprobadas a una factura.';
COMMENT ON COLUMN public.gu_facturas_certificaciones.factura_id IS 'ID de la factura';
COMMENT ON COLUMN public.gu_facturas_certificaciones.certificacion_id IS 'ID de la certificación asociada (debe estar en estado aprobado)';
