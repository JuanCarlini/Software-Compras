# SUMMARY — Fase 2: Slice ordenes_compra + UI

Estado: **COMPLETA** · verificada por E2E contra la base real (2026-07-23).

## Qué se construyó

| Task | Entregable | REQ |
|------|-----------|-----|
| 1 | Las rutas de `ordenes_compra` migradas de `requireRole` a `requirePermission('ordenes_compra', accion)`. Mapeo: GET→`ver`, POST/PUT/líneas→`crear`, DELETE cabecera→`borrar`, borrar-línea→`crear` (conserva la semántica previa), PATCH `/estado`→`accionRequerida(destino)`. | PERM-06 |
| 2 | `RolService.create/update` validan cada clave contra el catálogo (`esPermisoValido` → "Permiso inválido" → 400), ignoran `permisos` para el rol admin (anti auto-lockout), y persisten; `findAllOrdered` devuelve `permisos`. | PERM-08 (backend) |
| 3 | `src/views/rol-permisos-matrix.tsx` + matriz en la tab Roles (crear y editar). | PERM-07, PERM-08 (UI) |
| 4 | Verificación E2E por HTTP contra la base real. | PERM-10 |

## Evidencia E2E (2026-07-23, contra "Gestion Uno v2")

Fixture: rol custom `e2e_solo_ver_oc` con **un solo permiso** (`ordenes_compra:ver`) + usuario
asignado a ese rol.

| Prueba | Esperado | Obtenido |
|---|---|---|
| Crear rol con permiso inválido (`fake:accion`) | 400 | ✅ 400 `"Permiso inválido: fake:accion"` |
| `GET /api/ordenes-compra` (tiene `ver`) | 200 | ✅ 200 |
| `POST /api/ordenes-compra` | 403 | ✅ 403 |
| `PATCH /api/ordenes-compra/1/estado` | 403 | ✅ 403 |
| `DELETE /api/ordenes-compra/1` | 403 | ✅ 403 |
| `GET /api/facturas` (sin permiso del módulo) | 403 | ✅ 403 |
| admin: `GET` ordenes-compra y facturas | 200 | ✅ 200 (short-circuit) |

El último caso prueba **aislamiento entre módulos**: el rol solo alcanza al módulo que tiene
tildado. El de admin confirma que el short-circuit funciona con `permisos = []`.

Piso automático en el momento del cierre: `tsc --noEmit` verde · **390 tests en 27 archivos** verdes.

## Estado del catálogo en la base

`admin` → `[]` (short-circuit, a propósito) · `supervisor` → 20 · `usuario` → 12 ·
`readonly` → 6 · más roles custom creados desde la UI (p. ej. `compras`), que es la prueba
de que la feature está en uso real.

## Notas

- El rollout terminó siendo **más amplio que el slice planificado**: hoy hay **29 rutas** con
  `requirePermission` y **0** con `requireRole` — o sea que PERM-R1 (rollout a los otros
  módulos) quedó de hecho cumplido.
- En consecuencia, **PERM-R2** (retirar `requireRole` / `ROLES_*` / `stringToUserRole`) pasa a
  estar habilitado: ya no le quedan consumidores reales fuera de sus propios tests.
- El catálogo creció a **7 módulos / 22 permisos** (se sumó `proyectos`).
- Limpieza post-E2E: el rol de prueba se borró. Queda un usuario de prueba **inactivo**
  (`e2e-perm10@test.local`, reasignado a `readonly`) — la baja de usuarios es lógica por
  diseño, así que no se puede purgar desde la API. Borrarlo requiere SQL, si molesta.

## Milestone

Con esta fase, el milestone **RBAC (permisos personalizados por rol)** queda **completo**:
un rol dejó de ser cosmético y gobierna el acceso real, editable desde la UI.
