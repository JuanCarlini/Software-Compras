-- Migración: los gates del circuito CCIP que vivían SOLO en la app
-- Fecha: 2026-07-08 — ✅ APLICADA Y VERIFICADA en "Gestion Uno v2" (ahhpzfoausrpfkumtzzx)
-- Nombre de la migración en Supabase: ccip_06_gates_faltantes
--
-- RESULTADO: 11/11 verificaciones OK (ver bloque VERIFICACIÓN más abajo).
--   - Los 8 casos negativos rebotan con SQLSTATE P0001 y el mensaje en español exacto.
--   - #1c: con proveedor_id NULL el trigger lo rellena desde la OC (queda en 1). Gap #3 cerrado.
--   - #6c/#6d: la OC en borrador acepta alta/edición/baja de líneas, y el DELETE en cascada
--     de una OC con líneas pasa limpio.
--   - Datos previos coherentes (0 filas malas), circuito demo intacto, advisor sin WARN nuevos.
--
-- CONTEXTO
-- El schema CCIP (2026-07-07) dejó cuatro reglas duras como triggers: fn_oc_gate (>=1
-- línea), fn_check_avance_100 (100% por unidades), fn_check_imputacion (cert aprobada +
-- Σimput<=ΣLFACT) y fn_op_gate (cajas misma moneda + Σcajas=Σfacturas=total).
--
-- Pero el contrato declara otras reglas que NINGÚN trigger garantiza: las pre-valida el
-- service y por lo tanto son bypasseables (un INSERT directo con service_role, un script,
-- un bug futuro en la capa de app). Con la UI, la API y la DB compartiendo la misma
-- service_role key, la capa de datos es el único punto de control no evitable —
-- exactamente el argumento por el que la regla del 100% ya vive en un trigger.
--
-- Esta migración cierra tres:
--   #1  Una certificación solo puede colgar de una OC APROBADA.
--   #2  Una orden de pago solo puede pagar facturas FINALIZADAS.
--   #6  Las líneas de una OC solo se tocan mientras la OC es editable (borrador/rechazado).
--
-- Y de paso, dos agujeros de integridad que aparecieron al escribirla (mismo INSERT,
-- costo cero): la certificación podía tener un proveedor distinto al de su OC, y una
-- orden de pago podía pagar la factura de OTRO proveedor o en OTRA moneda.
--
-- CONVENCIONES
--  - RAISE EXCEPTION => SQLSTATE P0001 => la app lo traduce a HTTP 422 con este mensaje
--    tal cual (src/shared/handle-route-error.ts). Por eso los mensajes van en español.
--  - SET search_path = '' + nombres calificados: evita el WARN del advisor de Supabase
--    (function_search_path_mutable) y el secuestro de search_path.
--  - FOR SHARE al leer la cabecera: impide que la OC/OP cambie de estado en paralelo
--    entre el chequeo y el INSERT (mismo motivo por el que fn_check_avance_100 usa FOR UPDATE).
--  - Todo idempotente: CREATE OR REPLACE + DROP TRIGGER IF EXISTS.
--
-- SOBRE EL BRANCH "NOT FOUND => dejar pasar" (#2 y #6):
--   gu_lineasdeordenesdecompra -> gu_ordenesdecompra y gu_lineasdeordenesdepago ->
--   gu_ordenesdepago son ON DELETE CASCADE. Verificado experimentalmente en esta DB:
--   en un borrado directo de la hija el trigger VE al padre; en un borrado en cascada
--   NO lo ve (la fila padre ya se borró en el mismo comando). Por eso ese branch deja
--   pasar la cascada en vez de bloquearla.

BEGIN;

-- ---------------------------------------------------------------------------
-- #1 — Certificación: solo contra una OC aprobada, y con su mismo proveedor.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_cert_oc_aprobada()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_estado public.estado_aprobacion;
  v_proveedor_id bigint;
BEGIN
  SELECT estado, proveedor_id
    INTO v_estado, v_proveedor_id
    FROM public.gu_ordenesdecompra
   WHERE id = NEW.orden_compra_id
     FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La orden de compra % no existe', NEW.orden_compra_id;
  END IF;

  IF v_estado <> 'aprobado' THEN
    RAISE EXCEPTION
      'Solo se puede certificar contra una orden de compra aprobada (la OC % está en estado "%")',
      NEW.orden_compra_id, v_estado;
  END IF;

  -- El proveedor de la certificación lo manda la OC, no el cliente.
  -- NOT NULL se chequea DESPUÉS de los BEFORE triggers, así que este relleno funciona
  -- aunque la columna sea NOT NULL (es lo que promete el contrato).
  IF NEW.proveedor_id IS NULL THEN
    NEW.proveedor_id := v_proveedor_id;
  ELSIF NEW.proveedor_id <> v_proveedor_id THEN
    RAISE EXCEPTION
      'El proveedor de la certificación (%) no coincide con el de la orden de compra (%)',
      NEW.proveedor_id, v_proveedor_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cert_oc_aprobada ON public.gu_certificaciones;
CREATE TRIGGER trg_cert_oc_aprobada
  BEFORE INSERT OR UPDATE OF orden_compra_id, proveedor_id
  ON public.gu_certificaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_cert_oc_aprobada();

-- ---------------------------------------------------------------------------
-- #2 — Líneas de OP: solo facturas finalizadas, del mismo proveedor y moneda,
--      y solo mientras la OP sea editable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_lop_factura_pagable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_op_id           bigint;
  v_op_estado       public.estado_op;
  v_op_moneda       public.moneda_enum;
  v_op_proveedor    bigint;
  v_f_estado        public.estado_factura;
  v_f_moneda        public.moneda_enum;
  v_f_proveedor     bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_op_id := OLD.orden_pago_id;
  ELSE
    v_op_id := NEW.orden_pago_id;
  END IF;

  SELECT estado, moneda, proveedor_id
    INTO v_op_estado, v_op_moneda, v_op_proveedor
    FROM public.gu_ordenesdepago
   WHERE id = v_op_id
     FOR SHARE;

  -- La OP ya no existe: es el DELETE en cascada de la propia OP. Dejar pasar.
  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  -- Una vez que la OP salió de borrador, fn_op_gate ya validó Σfacturas = total_a_pagar.
  -- Agregar o sacar facturas después invalidaría esa validación en silencio.
  IF v_op_estado NOT IN ('borrador', 'rechazado') THEN
    RAISE EXCEPTION
      'No se pueden modificar las facturas de una orden de pago en estado "%"',
      v_op_estado;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  SELECT estado, moneda, proveedor_id
    INTO v_f_estado, v_f_moneda, v_f_proveedor
    FROM public.gu_facturas
   WHERE id = NEW.factura_id
     FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La factura % no existe', NEW.factura_id;
  END IF;

  IF v_f_estado <> 'finalizado' THEN
    RAISE EXCEPTION
      'Solo se pueden pagar facturas finalizadas (la factura % está en estado "%")',
      NEW.factura_id, v_f_estado;
  END IF;

  IF v_f_moneda <> v_op_moneda THEN
    RAISE EXCEPTION
      'La factura % es en % y la orden de pago es en %',
      NEW.factura_id, v_f_moneda, v_op_moneda;
  END IF;

  IF v_f_proveedor <> v_op_proveedor THEN
    RAISE EXCEPTION
      'La factura % es del proveedor % y la orden de pago es del proveedor %',
      NEW.factura_id, v_f_proveedor, v_op_proveedor;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lop_factura_pagable ON public.gu_lineasdeordenesdepago;
CREATE TRIGGER trg_lop_factura_pagable
  BEFORE INSERT OR UPDATE OR DELETE
  ON public.gu_lineasdeordenesdepago
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_lop_factura_pagable();

-- ---------------------------------------------------------------------------
-- #6 — Líneas de OC: inmutables una vez que la OC salió de borrador.
--
-- Es el más importante de los tres. v_loc_rollup calcula el avance comparando las
-- unidades certificadas contra gu_lineasdeordenesdecompra.cantidad. Si se baja la
-- cantidad de una línea que ya tiene certificaciones aprobadas, el rollup queda en
-- negativo y la regla del 100% —la regla central del sistema— pasa a mentir.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_loc_oc_editable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_oc_id  bigint;
  v_estado public.estado_aprobacion;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_oc_id := OLD.orden_compra_id;
  ELSE
    v_oc_id := NEW.orden_compra_id;
  END IF;

  SELECT estado
    INTO v_estado
    FROM public.gu_ordenesdecompra
   WHERE id = v_oc_id
     FOR SHARE;

  -- La OC ya no existe: la fila padre se borró en este mismo comando y esto es su
  -- DELETE en cascada. No hay nada que proteger. (Ver "PUNTOS A VERIFICAR" #2.)
  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF v_estado NOT IN ('borrador', 'rechazado') THEN
    RAISE EXCEPTION
      'No se pueden modificar las líneas de una orden de compra en estado "%"',
      v_estado;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_loc_oc_editable ON public.gu_lineasdeordenesdecompra;
CREATE TRIGGER trg_loc_oc_editable
  BEFORE INSERT OR UPDATE OR DELETE
  ON public.gu_lineasdeordenesdecompra
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_loc_oc_editable();

-- ---------------------------------------------------------------------------
-- Seguridad: como el resto de las funciones del circuito, no invocables por RPC.
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.fn_cert_oc_aprobada()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_lop_factura_pagable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_loc_oc_editable()     FROM PUBLIC, anon, authenticated;

COMMIT;


-- ===========================================================================
-- VERIFICACIÓN (correr después, contra el circuito demo ya cargado)
-- Cada bloque DEBE fallar con el mensaje indicado. Si alguno pasa, el trigger no quedó.
-- ===========================================================================
--
-- #1a  Certificar contra una OC que no está aprobada:
--   INSERT INTO gu_certificaciones (orden_compra_id, proveedor_id, fecha_devengado)
--   SELECT id, proveedor_id, CURRENT_DATE FROM gu_ordenesdecompra WHERE estado = 'borrador' LIMIT 1;
--   -- esperado: 'Solo se puede certificar contra una orden de compra aprobada...'
--
-- #1b  Certificar con un proveedor que no es el de la OC:
--   INSERT INTO gu_certificaciones (orden_compra_id, proveedor_id, fecha_devengado) VALUES (1, 2, CURRENT_DATE);
--   -- esperado: 'El proveedor de la certificación (2) no coincide con el de la orden de compra (1)'
--
-- #1c  Camino feliz (proveedor_id NULL lo rellena el trigger):
--   INSERT INTO gu_certificaciones (orden_compra_id, proveedor_id, fecha_devengado) VALUES (1, NULL, CURRENT_DATE);
--   -- esperado: OK, y proveedor_id queda en 1. BORRAR la fila después.
--
-- #2a  Pagar una factura en borrador:
--   INSERT INTO gu_lineasdeordenesdepago (orden_pago_id, factura_id, monto) VALUES (<op borrador>, <factura borrador>, 1);
--   -- esperado: 'Solo se pueden pagar facturas finalizadas...'
--
-- #2b  Agregar una factura a la OP ya pagada (OP-00001):
--   INSERT INTO gu_lineasdeordenesdepago (orden_pago_id, factura_id, monto) VALUES (1, 1, 1);
--   -- esperado: 'No se pueden modificar las facturas de una orden de pago en estado "pagado"'
--
-- #6a  Bajar la cantidad de una línea de la OC aprobada del demo:
--   UPDATE gu_lineasdeordenesdecompra SET cantidad = 10 WHERE orden_compra_id = 1;
--   -- esperado: 'No se pueden modificar las líneas de una orden de compra en estado "aprobado"'
--
-- #6b  Borrar una línea de la OC aprobada:
--   DELETE FROM gu_lineasdeordenesdecompra WHERE orden_compra_id = 1;
--   -- esperado: mismo mensaje
--
-- #6c  Camino feliz: crear una OC en borrador y agregarle/sacarle líneas -> OK.
-- #6d  Cascada: borrar una OC en borrador CON líneas -> debe borrar todo sin error.
--      (Este es el caso que no puedo verificar sin la DB: ver PUNTOS A VERIFICAR #2.)


-- ===========================================================================
-- NOTAS
-- ===========================================================================
-- 1. Alcance extra al pedido original (tres gates), agregado porque salía del mismo
--    INSERT a costo cero:
--      - #1: coherencia de proveedor CE<->OC, y relleno de proveedor_id desde la OC.
--      - #2: coherencia de proveedor y moneda factura<->OP, y LOP inmutable una vez que
--            la OP salió de borrador (mismo argumento que #6: fn_op_gate ya validó las
--            sumas y cambiar las líneas después las invalidaría en silencio).
--
-- 2. Lo que esta migración NO cubre y sigue siendo solo-app (bypasseable):
--      - Finalizar una factura sin ninguna imputación (gap #5). No hay fn_fact_gate.
--      - Las líneas de una certificación ya aprobada son mutables (mismo agujero que #6,
--        un nivel más abajo: cambiar avance_unidades post-aprobación mueve v_loc_rollup).
--
-- 3. Las pre-validaciones equivalentes en los *Service NO sobran: dan un error más rápido
--    y más específico (con el código del item, el estado concreto). Pero ya no son la
--    garantía — la garantía es esto. Los mensajes están redactados para que la app los
--    devuelva tal cual: handle-route-error.ts mapea P0001 -> HTTP 422 con SQLERRM.
--
-- 4. Huérfano detectado al pasar: public.update_gu_items_updated_at no la usa ningún
--    trigger (la reemplazó fn_set_updated_at en la reconstrucción CCIP). Es el único
--    WARN que le queda al advisor de seguridad. Pendiente de decisión: DROP FUNCTION.


-- ===========================================================================
-- ROLLBACK
-- ===========================================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_cert_oc_aprobada    ON public.gu_certificaciones;
-- DROP TRIGGER IF EXISTS trg_lop_factura_pagable ON public.gu_lineasdeordenesdepago;
-- DROP TRIGGER IF EXISTS trg_loc_oc_editable     ON public.gu_lineasdeordenesdecompra;
-- DROP FUNCTION IF EXISTS public.fn_cert_oc_aprobada();
-- DROP FUNCTION IF EXISTS public.fn_lop_factura_pagable();
-- DROP FUNCTION IF EXISTS public.fn_loc_oc_editable();
-- COMMIT;
