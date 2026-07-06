-- Migración: activar Row Level Security en todas las tablas gu_* (candado anti acceso directo)
-- Fecha: 2026-07-04 (pendiente de aplicar con OK explícito)
--
-- Diseño (decisión 2026-07-04, sesión de seguridad):
--  - La app usa JWT custom → PostgREST no puede ver los roles de la aplicación,
--    por lo que políticas RLS "por rol" son inaplicables con esta arquitectura.
--  - El browser ya NO habla con Supabase: todo el acceso a datos pasa por las API
--    routes de Next.js, que corren server-side con la SERVICE_ROLE key (bypasea RLS)
--    y aplican los roles de la app en la capa de aplicación (shared/permissions.ts
--    + middleware con verificación de firma JWT).
--  - RLS habilitado SIN políticas = deny-all para el rol anon: la anon key pública
--    (que viaja en cualquier bundle viejo o request manual) queda sin acceso a nada.
--
-- Resultado: defensa en profundidad — perímetro (middleware JWT) + aplicación
-- (requireAuth/requireAdmin + permisos por rol) + datos (RLS deny-anon + triggers).

ALTER TABLE public.gu_roles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_usuario                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_proveedores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_proyectos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_ordenesdecompra           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_lineasdeordenesdecompra   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_certificaciones           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_lineasdecertificacion     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_facturas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_lineasdefactura           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_facturas_certificaciones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_ordenesdepago             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_lineasdeordenesdepago     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_lineasdeordenesdepagocaja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_items                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_auditoria                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gu_audit_log                 ENABLE ROW LEVEL SECURITY;

-- Hardening extra (migración revoke_execute_trigger_fns): las funciones de trigger
-- no deben ser invocables como RPC por anon/authenticated (siguen corriendo como triggers).
REVOKE EXECUTE ON FUNCTION public.fn_audit_log() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_certificacion_max_100() FROM anon, authenticated, public;
