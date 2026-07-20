# SUMMARY — Fase 1: Mecanismo de permisos

Estado: **COMPLETA** · verificada (tsc + 151 tests verdes, 0 regresión).

## Qué se construyó

| Task | Entregable | REQ |
|------|-----------|-----|
| 1 | Schema aplicado por la sesión Supabase: `gu_roles.permisos text[]` + seed de los 4 roles (admin `{}`, supervisor 20, usuario 12, readonly 6) + `database.types.ts` regenerado (`permisos: string[]`). DDL versionado en `supabase/migrations/`. | PERM-02, PERM-03 |
| 2 | `src/shared/permissions-catalog.ts`: 20 claves `modulo:accion` válidas + `esPermisoValido`. | PERM-01 |
| 3 | `tienePermiso` pura en `permissions.ts` (admin short-circuit + membership) + `permissions.test.ts` (9 casos). | PERM-05, PERM-09 |
| 4 | `RolRepository.findPermisosByNombre` (I/O) + `requirePermission(modulo, accion)` en `permissions-server.ts` (resuelve permisos frescos por request, 403 si falta, shape `{ error, user }` idéntico a `requireRole`). | PERM-04, PERM-05 |

## Verificación (criterios del ROADMAP)

1. Catálogo enumera 20 claves + valida → `permissions-catalog.ts`, test `PERMISOS_VALIDOS.size===20`. ✓
2. `gu_roles.permisos` poblado; 4 roles replican la autorización actual → seed aplicado + SELECT verificado por la sesión Supabase. ✓
3. `requirePermission` resuelve por request y 403 si falta, shape `{ error, user }` → Task 4, tsc verde. ✓
4. admin pasa siempre aun con array vacío → `tienePermiso` short-circuit, test admin→todo. ✓
5. `tienePermiso` cubierto por tests → 9 casos verdes. ✓

## Notas / decisiones (ponytail)

- `admin` seed = `'{}'`: el short-circuit es la única fuente de verdad (sin duplicado stale-able). La UI de Fase 2 mostrará admin todo-tildado por special-case, no leyendo el array.
- `requirePermission` no cablea ninguna ruta todavía: solo define el helper. El cableado del slice `ordenes_compra` + UI de matriz + E2E son la **Fase 2**.
- Cero deps nuevas. Los grupos `ROLES_*` y las 98 rutas con `requireRole` siguen intactos (Fase 2 migra `ordenes_compra`; el resto queda para el rollout PERM-R1).

## Siguiente

Fase 2: slice `ordenes_compra` sobre `requirePermission` + matriz de checkboxes en la tab Roles + E2E sin regresión (PERM-06,07,08,10).
