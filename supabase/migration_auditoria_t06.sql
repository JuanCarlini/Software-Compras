-- Migración T06: Auditoría — control de cambios vía triggers (capa de datos)
-- Fecha: 2026-07-04 (aplicada en "Gestion Uno v2" como auditoria_t06)
--
-- Diseño híbrido:
--  - gu_audit_log  = CONTROL DE CAMBIOS (historial con valores anteriores/nuevos).
--    Lo escriben TRIGGERS en la DB, así que ninguna escritura puede saltearlo
--    (la UI habla directo a Supabase; el trigger es el único punto garantizado).
--  - gu_auditoria  = BITÁCORA de operaciones con usuario (login/logout + acciones
--    que pasan por API routes). La escribe la app server-side, donde el JWT
--    identifica al usuario. Ver src/lib/audit/audit.service.ts.
--
-- El trigger no ve el usuario de app (Postgres solo ve el rol anónimo de PostgREST),
-- por eso usuario_id pasa a NULLABLE. Queda un hook (app.audit_user_id) para cuando
-- el refactor de seguridad enrute las escrituras por el servidor y pueda setearlo.

-- 1) usuario_id nullable: el trigger registra el cambio aunque no haya usuario de app
ALTER TABLE public.gu_audit_log ALTER COLUMN usuario_id DROP NOT NULL;

-- 2) Función genérica de auditoría de cambios
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_accion public.audit_accion;
  v_registro_id BIGINT;
  v_datos_ant JSONB;
  v_datos_nue JSONB;
  v_usuario_id BIGINT;
BEGIN
  -- Atribución opcional: si el server seteó app.audit_user_id en la sesión, se usa.
  -- Hoy suele venir NULL (escrituras directas del browser). Forward-compat.
  BEGIN
    v_usuario_id := NULLIF(current_setting('app.audit_user_id', true), '')::BIGINT;
  EXCEPTION WHEN others THEN
    v_usuario_id := NULL;
  END;

  IF (TG_OP = 'INSERT') THEN
    v_accion := 'crear';       v_registro_id := NEW.id;
    v_datos_ant := NULL;       v_datos_nue := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_accion := 'actualizar';  v_registro_id := NEW.id;
    v_datos_ant := to_jsonb(OLD); v_datos_nue := to_jsonb(NEW);
  ELSE -- DELETE
    v_accion := 'eliminar';    v_registro_id := OLD.id;
    v_datos_ant := to_jsonb(OLD); v_datos_nue := NULL;
  END IF;

  INSERT INTO public.gu_audit_log
    (tabla_afectada, registro_id, usuario_id, accion, datos_anteriores, datos_nuevos)
  VALUES
    (TG_TABLE_NAME, v_registro_id, v_usuario_id, v_accion, v_datos_ant, v_datos_nue);

  IF (TG_OP = 'DELETE') THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- 3) Triggers sobre las 4 entidades críticas del flujo OC → Cert → Factura → OP
CREATE TRIGGER trg_audit_oc      AFTER INSERT OR UPDATE OR DELETE ON public.gu_ordenesdecompra FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit_cert    AFTER INSERT OR UPDATE OR DELETE ON public.gu_certificaciones FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit_factura AFTER INSERT OR UPDATE OR DELETE ON public.gu_facturas        FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
CREATE TRIGGER trg_audit_op      AFTER INSERT OR UPDATE OR DELETE ON public.gu_ordenesdepago   FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();
