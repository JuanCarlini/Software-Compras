# Requirements — Milestone: Permisos personalizados por rol (RBAC real)

Fuente: `docs/superpowers/specs/2026-07-20-roles-permisos-design.md`.

## v1 Requirements

### Modelo y almacenamiento
- [ ] **PERM-01**: El catálogo de permisos (`modulo:accion`, ~20 claves con etiqueta y
  módulo) vive en código (`src/shared/permissions-catalog.ts`) y valida qué claves son legítimas.
- [ ] **PERM-02**: Cada rol almacena su conjunto de permisos en `gu_roles.permisos text[]`
  (columna nueva, `NOT NULL DEFAULT '{}'`).
- [ ] **PERM-03**: Los 4 roles del sistema se siembran replicando la autorización actual
  (supervisor=todo; usuario=ver/crear; readonly=ver; admin=todo implícito).

### Enforcement
- [ ] **PERM-04**: Existe `requirePermission(modulo, accion)` que resuelve el rol del
  usuario → sus permisos (per-request, sin staleness) y devuelve 403 si falta el permiso.
- [ ] **PERM-05**: El rol `admin` siempre pasa (short-circuit anti auto-lockout).
- [ ] **PERM-06**: Las rutas del módulo `ordenes_compra` (vertical slice) usan
  `requirePermission` con el mapeo ver/crear/aprobar/borrar; los demás módulos quedan igual.

### UI
- [ ] **PERM-07**: En la tab Roles de `/admin/usuarios`, el form de rol muestra una matriz
  de checkboxes (módulos × acciones) y guarda `permisos[]` vía la API admin.
- [ ] **PERM-08**: `admin` se muestra como todo-tildado y no editable; el resto editable con
  guarda anti auto-lockout; el service valida `permisos[]` contra el catálogo (400 si inválido).

### Calidad
- [ ] **PERM-09**: Test unit del chequeo puro de permisos (tiene/no-tiene, admin→todo,
  readonly→solo ver, clave inexistente).
- [ ] **PERM-10**: El slice se verifica E2E (un rol custom con solo `ordenes_compra:ver`
  lista pero recibe 403 al crear/aprobar/borrar; supervisor mantiene acceso). Piso: tsc +
  build + los 142 tests existentes en verde.

## v2 / Deferred (post-slice)

- **PERM-R1**: Rollout de `requirePermission` a los otros 5 módulos (certificaciones,
  facturas, ordenes_pago, proveedores, items) — mecánico, ~35 rutas.
- **PERM-R2**: Retirar los grupos `ROLES_*` y `stringToUserRole` cuando no queden consumidores.

## Out of Scope

- Sección admin (usuarios/roles/auditoría) en el modelo de permisos — sigue admin-only (`requireAdmin`).
- Permisos por recurso individual / a nivel de fila / árbol jerárquico — YAGNI para este ERP.
- Tabla de catálogo de permisos en DB — el catálogo vive en código (evita drift).

## Traceability

(Se completa al crear el roadmap — mapeo REQ-ID → fase.)
