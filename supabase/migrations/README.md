# supabase/migrations — DDL aplicado, versionado

Migraciones **realmente aplicadas** en el proyecto Supabase "Gestion Uno v2"
(`ahhpzfoausrpfkumtzzx`), extraídas el 2026-07-20 desde
`supabase_migrations.schema_migrations` y verificadas por `md5`: cada archivo es
**byte-idéntico** al SQL que corrió contra la base.

El nombre usa el formato del CLI de Supabase (`<version>_<name>.sql`) para que el orden
de ejecución sea inequívoco y `supabase db push` / `db reset` los tomen tal cual.

| Archivo | Qué hace |
|---|---|
| `20260707202539_ccip_01_drop_circuito.sql` | Dropea las 11 tablas del circuito viejo + enums + `check_certificacion_max_100` |
| `20260707202619_ccip_02_enums_catalogo.sql` | Enums CCIP, `fn_set_updated_at`, `gu_items`, `gu_item_proveedor_precio`, `gu_cajas` |
| `20260707202742_ccip_03_documentos.sql` | Las 10 tablas del circuito OC → CE → FACT → OP |
| `20260707203015_ccip_04_triggers_reglas.sql` | Numeración, `fn_lce_derive`, regla del 100%, imputación, gates OC/OP, re-enganche de auditoría |
| `20260707203128_ccip_05_views_rls.sql` | Las 4 vistas de rollup (`security_invoker`) + RLS deny-anon |
| `20260708040353_ccip_06_gates_faltantes.sql` | Gates #1 (cert sobre OC aprobada), #2 (pagar solo facturas finalizadas), #6 (líneas de OC inmutables) |
| `20260708041510_ccip_07_drop_funcion_huerfana.sql` | Dropea `update_gu_items_updated_at` (huérfana; era el último WARN del advisor) |

## ⚠️ Esta carpeta NO alcanza para reconstruir la base desde cero

`ccip_01` arranca dropeando tablas que crearon migraciones anteriores, y el circuito
referencia objetos que **no** se crean acá: `moneda_enum`, `gu_proveedores`,
`gu_proyectos`, `gu_usuario`, `gu_roles`, `fn_audit_log`, `gu_auditoria`, `gu_audit_log`.

Esos viven en las 7 migraciones previas (`initial_schema`, `items_catalogo`,
`items_lineas_oc`, `cert_oc_trazabilidad`, `auditoria_t06`, `rls_deny_anon`,
`revoke_execute_trigger_fns`), que **todavía no están volcadas acá**. Sus contrapartes
sueltas en `supabase/*.sql` son las versiones *escritas a mano*, no necesariamente lo
aplicado (`schema.sql` está documentado como incompleto respecto de la DB real).

Para tener resguardo completo hay que volcar también esas 7 (mismo método: leer
`statements` de `supabase_migrations.schema_migrations` y verificar por `md5`).

## Relación con los `supabase/migration_*.sql` sueltos

Los archivos planos del directorio padre son los **borradores comentados** con los que se
trabajó. Hay solapamiento deliberado: `migration_ccip_gates_faltantes.sql` es la versión
larga y anotada de `20260708040353_ccip_06_gates_faltantes.sql` (incluye el bloque de
verificación y el rollback). Ante una diferencia, **manda esta carpeta**: es lo aplicado.
