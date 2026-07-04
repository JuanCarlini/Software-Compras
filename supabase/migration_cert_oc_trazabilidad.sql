-- Migración: trazabilidad Certificación -> Línea de OC + regla del 100%
-- Fecha: 2026-07-02 (aplicada en "Gestion Uno v2" como cert_oc_trazabilidad)
-- linea_oc_id es NULLABLE: las líneas legacy y las "líneas libres" (conceptos
-- fuera de una OC) siguen siendo válidas; la regla del 100% aplica solo a líneas vinculadas.

ALTER TABLE public.gu_lineasdecertificacion
ADD COLUMN linea_oc_id BIGINT;

ALTER TABLE public.gu_lineasdecertificacion
ADD CONSTRAINT fk_lcert_linea_oc
FOREIGN KEY (linea_oc_id) REFERENCES public.gu_lineasdeordenesdecompra(id);

CREATE INDEX idx_lcert_linea_oc ON public.gu_lineasdecertificacion (linea_oc_id);

COMMENT ON COLUMN public.gu_lineasdecertificacion.linea_oc_id IS 'Línea de OC que se está certificando. NULL = línea libre (sin trazabilidad a OC). Si está presente, el trigger check_certificacion_max_100 garantiza que la suma certificada no supere la cantidad de la línea de OC.';

-- Regla de negocio: no se puede certificar más del 100% de una línea de OC.
-- Se implementa como trigger (capa de datos) para que ningún cliente pueda saltearla.
CREATE OR REPLACE FUNCTION public.check_certificacion_max_100()
RETURNS TRIGGER AS $$
DECLARE
  oc_cantidad NUMERIC;
  ya_certificado NUMERIC;
BEGIN
  -- líneas libres o rechazadas no consumen cupo
  IF NEW.linea_oc_id IS NULL OR NEW.estado = 'rechazado' THEN
    RETURN NEW;
  END IF;

  -- lock de la línea de OC: serializa certificaciones concurrentes sobre la misma línea
  SELECT cantidad INTO oc_cantidad
  FROM public.gu_lineasdeordenesdecompra
  WHERE id = NEW.linea_oc_id
  FOR UPDATE;

  IF oc_cantidad IS NULL THEN
    RAISE EXCEPTION 'La línea de OC % no existe', NEW.linea_oc_id;
  END IF;

  SELECT COALESCE(SUM(cantidad), 0) INTO ya_certificado
  FROM public.gu_lineasdecertificacion
  WHERE linea_oc_id = NEW.linea_oc_id
    AND estado <> 'rechazado'
    AND id <> NEW.id;

  IF ya_certificado + NEW.cantidad > oc_cantidad THEN
    RAISE EXCEPTION 'No se puede certificar más del 100%% de la línea de OC: cantidad de la OC %, ya certificado %, se intentó certificar %',
      oc_cantidad, ya_certificado, NEW.cantidad;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lcert_max_100
  BEFORE INSERT OR UPDATE OF cantidad, linea_oc_id, estado ON public.gu_lineasdecertificacion
  FOR EACH ROW
  EXECUTE FUNCTION public.check_certificacion_max_100();
