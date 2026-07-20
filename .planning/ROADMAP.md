# Roadmap: Permisos personalizados por rol (RBAC real)

## Overview

Milestone acotado sobre un ERP existente (brownfield): convertir los roles de
"solo nombre + descripción con permisos hardcodeados" en RBAC real. El camino es un
**vertical slice**: primero el mecanismo (catálogo de permisos en código, columna
`gu_roles.permisos text[]`, `requirePermission()` que chequea permisos frescos por
request), luego su aplicación end-to-end en un único módulo (`ordenes_compra`) más la
UI de matriz de checkboxes para editarlos, verificado sin regresión. El seed replica el
comportamiento actual 1:1, así activar el slice no cambia el acceso de ningún usuario
existente. NO se planifica el ERP entero — solo este milestone.

**Dependencia externa dura:** el cambio de schema (`ALTER TABLE gu_roles ADD COLUMN
permisos text[] NOT NULL DEFAULT '{}'` + UPDATE de seed de los 4 roles + regenerar
`database.types.ts`) lo aplica una **sesión separada con el MCP de Supabase** — regla del
proyecto: el código no toca Supabase. La línea de código entrega el DDL + los sets de
seed; la aplicación efectiva es responsabilidad de esa sesión.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Mecanismo de permisos** - Catálogo + columna DB + `requirePermission` + chequeo puro testeado
- [ ] **Phase 2: Slice ordenes_compra + UI** - Cableado end-to-end en un módulo, matriz de checkboxes y verificación E2E sin regresión

## Phase Details

### Phase 1: Mecanismo de permisos
**Goal**: El mecanismo de RBAC existe y es verificable en aislamiento — un rol tiene su conjunto de permisos `modulo:accion` en la DB y la autorización los chequea frescos por request, con short-circuit de admin.
**Depends on**: Sesión externa con MCP de Supabase (aplica `ALTER TABLE gu_roles ADD COLUMN permisos text[]` + seed de los 4 roles + regenera `database.types.ts`). La línea de código entrega el DDL y los sets de seed como insumo de esa sesión.
**Requirements**: PERM-01, PERM-02, PERM-03, PERM-04, PERM-05, PERM-09
**Success Criteria** (what must be TRUE):
  1. El catálogo en código (`permissions-catalog.ts`) enumera las ~20 claves `modulo:accion` válidas y expone el helper para validar que un `permisos[]` solo contenga claves legítimas.
  2. Cada rol persiste sus permisos en `gu_roles.permisos text[]`; los 4 roles del sistema arrancan con los sets que replican la autorización actual (supervisor=todo; usuario=ver/crear; readonly=ver; admin=implícito).
  3. `requirePermission(modulo, accion)` resuelve los permisos del rol por request (sin staleness de JWT) y devuelve 403 cuando falta el permiso, con el mismo shape `{ error, user }` que `requireRole`.
  4. Un usuario con rol `admin` pasa siempre, aun con el array vacío (short-circuit anti auto-lockout).
  5. El chequeo puro `tienePermiso(...)` está cubierto por tests unit: tiene/no-tiene, admin→todo, readonly→solo `ver`, clave inexistente.
**Plans**: TBD

### Phase 2: Slice ordenes_compra + UI
**Goal**: El módulo `ordenes_compra` corre su autorización sobre permisos reales, un admin edita los permisos de cada rol desde una matriz de checkboxes, y el circuito queda verificado end-to-end sin regresión para los usuarios actuales.
**Depends on**: Phase 1
**Requirements**: PERM-06, PERM-07, PERM-08, PERM-10
**Success Criteria** (what must be TRUE):
  1. Las rutas de `ordenes_compra` autorizan vía `requirePermission` con el mapeo ver/crear/aprobar/borrar; los otros 5 módulos siguen con `requireRole` sin cambios.
  2. En la tab Roles de `/admin/usuarios`, un admin asigna/quita permisos de un rol desde la matriz de checkboxes (módulos × acciones, solo celdas válidas del catálogo) y se guardan vía la API admin.
  3. `admin` se muestra todo-tildado y no editable; la guarda anti auto-lockout impide dejarse sin acceso; el service rechaza con 400 un `permisos[]` con claves fuera del catálogo.
  4. Un rol custom con solo `ordenes_compra:ver` lista OC pero recibe 403 al crear/aprobar/borrar, mientras `supervisor` mantiene acceso completo (verificado E2E por HTTP).
  5. Piso verde: `tsc` + `npm run build` + los 142 tests existentes sin regresión.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Mecanismo de permisos | 0/TBD | Not started | - |
| 2. Slice ordenes_compra + UI | 0/TBD | Not started | - |

## Next Milestone (post-slice, fuera de este roadmap v1)

- **PERM-R1**: Rollout de `requirePermission` a los otros 5 módulos (certificaciones, facturas, ordenes_pago, proveedores, items) — mecánico, ~35 rutas.
- **PERM-R2**: Retirar los grupos `ROLES_*` y `stringToUserRole` cuando no queden consumidores.
