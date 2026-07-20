# Permisos personalizados por rol (RBAC real) — Spec de diseño

> Fecha: 2026-07-20 · Estado: aprobado para planificar · Autor: sesión de código
> Rama destino sugerida: `feat/roles-permisos` desde `dev`.

## Contexto y problema

Hoy `gu_roles` tiene solo `nombre` + `descripcion`. Los permisos **no están en la DB**:
viven hardcodeados en `src/shared/permissions.ts` como grupos (`ROLES_ESCRITURA`,
`ROLES_DESTRUCTIVO`, `ROLES_APROBACION`) atados a los **nombres** de los 4 roles del
sistema. La autorización se aplica en ~99 sitios de rutas API vía `requireRole(grupo)`.
Un rol nuevo creado desde la UI cae por default en permisos de "usuario"
(`stringToUserRole` → `USUARIO`). Resultado: **crear un rol es cosmético** — no puede
tener permisos propios.

Objetivo: convertirlo en RBAC real — un rol puede tener un conjunto de permisos
personalizados, editables desde la UI, que **gobiernan el acceso real**.

> Nota de tesis: esto revierte la decisión T04 (2026-07-04) que difería el árbol de
> permisos por considerar suficiente el modelo plano. Actualizar el razonamiento del
> anexo T04 en la sesión de documentación (fuera de alcance de este spec).

## Metas / No-metas

**Metas**
- Modelo de permisos `modulo:accion` almacenado por rol en la DB.
- `requirePermission(modulo, accion)` como mecanismo de autorización.
- UI de matriz de checkboxes (módulos × acciones) en la tab Roles existente.
- Vertical slice: mecanismo completo + cableado end-to-end en **un** módulo
  (`ordenes_compra`), verificado.
- Cero cambio de comportamiento para los usuarios/roles actuales al activar el slice.

**No-metas (YAGNI por ahora)**
- Migrar los 99 sitios de una (se hace después del slice, mecánico).
- Meter la sección admin (usuarios/roles/auditoría) en el modelo de permisos: sigue
  siendo admin-only vía `requireAdmin`.
- Tabla de catálogo de permisos en DB (el catálogo vive en código).
- Permisos por recurso individual / a nivel de fila / árbol jerárquico.

## Modelo de permiso

Clave = `modulo:accion`. **4 acciones** que calcan la semántica de autorización actual
(así el seed reproduce el comportamiento de hoy 1:1):

| Acción   | Equivale hoy a            | Rutas típicas |
|----------|---------------------------|---------------|
| `ver`    | GET                       | listar / detalle |
| `crear`  | `ROLES_ESCRITURA`         | POST / PUT (crear/editar) |
| `aprobar`| `ROLES_APROBACION`        | PATCH `/estado` (aprobar/rechazar/anular/pagar) |
| `borrar` | `ROLES_DESTRUCTIVO`       | DELETE |

**Módulos (6):** `ordenes_compra`, `certificaciones`, `facturas`, `ordenes_pago`,
`proveedores`, `items`. → ~20 permisos (no todo módulo tiene las 4 acciones; el catálogo
declara los pares válidos).

La sección admin (usuarios/roles/auditoría) NO entra: sigue gobernada por `requireAdmin`
(rol `admin` únicamente).

## Almacenamiento

- **Catálogo** (las ~20 claves + etiqueta legible + agrupación por módulo) → **código**:
  `src/shared/permissions-catalog.ts`. Fuente de verdad estática, atada a las rutas; una
  tabla en DB solo duplicaría y driftearía. Exporta también el helper para la UI (módulos
  → acciones disponibles) y para validar que un `permisos[]` solo contenga claves válidas.
- **Asignación** rol→permisos → **DB**: nueva columna `gu_roles.permisos text[]` (array de
  claves `modulo:accion`), `NOT NULL DEFAULT '{}'`. Más lazy que una tabla N:M: update
  atómico por rol, sin join en el path caliente de autorización.

> Cambio de schema (columna + backfill/seed): lo aplica la sesión con el MCP de Supabase
> (regla dura del proyecto). Entregable para esa sesión: el DDL + los sets de seed de los
> 4 roles del sistema (ver "Seed").

## Enforcement

Nuevo helper en `src/shared/permissions-server.ts`:

```
requirePermission(modulo, accion) -> { error, user }
```

- Resuelve el rol del usuario → su `permisos[]` (1 query por request sobre `gu_roles`;
  permisos siempre frescos, sin staleness de JWT ni re-login).
- Chequea que `"${modulo}:${accion}"` esté en el array. Si no → 403.
- **`admin` siempre pasa** (short-circuit antes de mirar el array): anti auto-lockout.
- Devuelve el mismo shape `{ error, user }` que `requireRole` para no tocar el patrón de
  las rutas.

La lógica pura de chequeo (¿este set de permisos cubre `modulo:accion`?, con la regla
admin-todo) se extrae a una función testeable sin DB en `permissions.ts`
(ej. `tienePermiso(rolNombre, permisos, modulo, accion)`).

Durante el slice, los otros ~98 sitios siguen con `requireRole` **sin cambios**.

## Alcance del vertical slice

Cablear `requirePermission` en las rutas de `ordenes_compra` únicamente:
- `GET /api/ordenes-compra` y `/[id]` → `ver`
- `POST /api/ordenes-compra`, `PUT /[id]`, rutas de líneas (crear/editar) → `crear`
- `PATCH /api/ordenes-compra/[id]/estado` → `aprobar`
- `DELETE /api/ordenes-compra/[id]` (y borrar línea) → `borrar`

Nada más cambia de enforcement. Esto prueba el mecanismo completo end-to-end.

## UI

En la tab **Roles** de `/admin/usuarios` (form de crear/editar rol), agregar una **matriz
de checkboxes**: filas = módulos, columnas = acciones (`ver/crear/aprobar/borrar`), solo
las celdas que el catálogo declara válidas.

- Al guardar, se manda `permisos: string[]` a `PUT /api/admin/roles/[id]` (y en el create).
- **`admin`**: matriz en modo solo-lectura, todo tildado (no editable; siempre todo).
- **`readonly`** (y demás): editable, pero con guarda anti auto-lockout — un admin no puede
  quitarse a sí mismo el acceso que lo dejaría fuera (ver "Guardas").
- Reusar los componentes shadcn existentes (`checkbox`, `card`, `label`). Cero deps nuevas.

`RolService.update`/`create` validan que cada clave de `permisos[]` exista en el catálogo
(rechazo 400 si no) antes de escribir.

## Seed (comportamiento idéntico al de hoy)

Los 4 roles del sistema se siembran para reproducir la autorización actual:

| Rol        | Permisos |
|------------|----------|
| `admin`    | todos (implícito por short-circuit; el array puede quedar `{}` o full, es indistinto) |
| `supervisor` | `ver/crear/aprobar/borrar` en los 6 módulos |
| `usuario`  | `ver/crear` en los 6 módulos |
| `readonly` | `ver` en los 6 módulos |

Así, al activar el slice, ningún usuario existente ve un cambio de acceso.

## Guardas de seguridad

- `admin` no editable y siempre todo-permitido (anti lock-out del sistema).
- Los roles del sistema (`admin/usuarios/supervisor/readonly`) siguen protegidos contra
  rename/delete (ya existe en `RolService`); sus **permisos** sí son editables salvo `admin`.
- Validación de `permisos[]` contra el catálogo en el service (no confiar en el body).
- La ruta `PUT /api/admin/roles/[id]` sigue detrás de `requireAdmin`.

## Testing (ponytail: un check runnable)

- Unit del chequeo puro `tienePermiso(...)`: cubre tiene/no-tiene, `admin`→todo,
  `readonly`→solo `ver`, clave inexistente. Mockeando el repo donde haga falta.
- El slice se verifica **E2E** por HTTP contra el circuito demo: un rol custom con solo
  `ordenes_compra:ver` puede listar pero recibe 403 al crear/aprobar/borrar; `supervisor`
  mantiene acceso completo.
- Piso: `tsc`, `npm run build`, `npm test` en verde (la suite existente no debe romperse:
  el seed replica el comportamiento actual).

## Reparto de trabajo

- **DB (sesión con MCP Supabase):** aplicar `ALTER TABLE gu_roles ADD COLUMN permisos
  text[] NOT NULL DEFAULT '{}'` + UPDATE de seed de los 4 roles + regenerar
  `database.types.ts`.
- **Código (esta línea de trabajo):** catálogo, `tienePermiso`, `requirePermission`,
  cableado del slice `ordenes_compra`, `RolService`/rutas admin con validación de permisos,
  UI de matriz, tests.

## Rollout posterior al slice (fuera de este entregable)

Una vez aprobado el slice, migrar los otros 5 módulos: reemplazar cada `requireRole(grupo)`
por `requirePermission(modulo, accion)` (mecánico, ~35 rutas). Después, retirar los grupos
`ROLES_*` y `stringToUserRole` cuando ya no queden consumidores.
