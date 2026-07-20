---
phase: 02-slice-ordenes-compra-ui
plan: 01
type: execute
wave: 1
depends_on: ["01-01"]
autonomous: false        # Task 4 es un checkpoint:human-verify (E2E con dev server + DB demo)
requirements: [PERM-06, PERM-07, PERM-08, PERM-10]
files_modified:
  - src/shared/transiciones.ts
  - src/app/api/ordenes-compra/route.ts
  - src/app/api/ordenes-compra/[id]/route.ts
  - src/app/api/ordenes-compra/[id]/estado/route.ts
  - src/app/api/ordenes-compra/[id]/lineas/route.ts
  - src/app/api/ordenes-compra/lineas/[lineaId]/route.ts
  - src/controllers/rol.controller.ts
  - src/repositories/rol.repository.ts
  - src/app/api/admin/roles/route.ts
  - src/app/api/admin/roles/[id]/route.ts
  - src/views/rol-permisos-matrix.tsx
  - src/app/(dashboard)/admin/usuarios/page.tsx

must_haves:
  truths:
    - "Un rol custom con solo ordenes_compra:ver lista OC (GET 200) pero recibe 403 al crear/editar/aprobar/borrar."
    - "supervisor conserva acceso completo a ordenes_compra tras el cambio (seed replica el comportamiento actual)."
    - "Un admin ve la matriz de permisos de cada rol y puede tildar/destildar celdas válidas; se guardan en gu_roles.permisos."
    - "El rol admin se muestra todo-tildado y no editable."
    - "RolService rechaza con 400 un permisos[] con claves fuera del catálogo."
    - "Los otros 5 módulos siguen autorizando con requireRole (sin cambios)."
  artifacts:
    - path: "src/views/rol-permisos-matrix.tsx"
      provides: "Matriz de checkboxes módulos × acciones (solo celdas válidas del catálogo)"
      min_lines: 30
    - path: "src/app/api/ordenes-compra/route.ts"
      provides: "GET sin gate de rol / POST con requirePermission('ordenes_compra','crear')"
      contains: "requirePermission"
    - path: "src/app/api/ordenes-compra/[id]/estado/route.ts"
      provides: "PATCH con requirePermission ver/crear/aprobar según destino"
      contains: "requirePermission"
  key_links:
    - from: "src/app/api/ordenes-compra/[id]/estado/route.ts"
      to: "src/shared/transiciones.ts (accionRequerida)"
      via: "mapeo destino → accion de permiso"
      pattern: "accionRequerida"
    - from: "src/controllers/rol.controller.ts"
      to: "src/shared/permissions-catalog.ts (esPermisoValido)"
      via: "validación de permisos[] antes de escribir"
      pattern: "esPermisoValido"
    - from: "src/app/(dashboard)/admin/usuarios/page.tsx"
      to: "PUT /api/admin/roles/[id]"
      via: "fetch con body { permisos }"
      pattern: "permisos"
---

<objective>
Cablear el módulo `ordenes_compra` sobre `requirePermission` (PERM-06), agregar la matriz de
checkboxes para editar los permisos de cada rol desde la tab Roles (PERM-07/08) y verificar el
slice end-to-end sin regresión (PERM-10).

Purpose: cerrar el vertical slice de RBAC real — un rol custom deja de ser cosmético y gobierna
el acceso real de un módulo completo, editable desde la UI.

Output: 5 rutas de OC autorizando por permiso, `RolService` validando `permisos[]` contra el
catálogo, la matriz en la tab Roles, y el circuito verificado por HTTP.

Ponytail: los cambios en las rutas son reemplazos mecánicos (`requireRole(GRUPO)` →
`requirePermission('ordenes_compra', accion)`); la matriz reusa checkbox/card/label shadcn; cero
deps nuevas; no se rediseña la tab, solo se suma el dialog de permisos.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@docs/superpowers/specs/2026-07-20-roles-permisos-design.md
@.planning/phases/01-mecanismo-de-permisos/01-01-SUMMARY.md

<interfaces>
<!-- Todo esto YA existe (Fase 1). El executor lo consume tal cual, sin explorar. -->

De src/shared/permissions-server.ts:
```typescript
// Ya definida y lista para cablear. Mismo shape { error, user } que requireRole.
export async function requirePermission(modulo: string, accion: string):
  Promise<{ error: NextResponse | null, user: {...} | null }>
```

De src/shared/permissions-catalog.ts:
```typescript
export type Accion = "ver" | "crear" | "aprobar" | "borrar"
export const ACCION_LABEL: Record<Accion, string>
export const PERMISOS_CATALOGO: Record<Modulo, { label: string; acciones: Accion[] }>
export type Modulo = keyof typeof PERMISOS_CATALOGO   // 6 módulos
export function esPermisoValido(clave: string): boolean   // "modulo:accion" ∈ catálogo
```

De src/shared/transiciones.ts (existente):
```typescript
const REQUIERE_APROBACION = new Set(["aprobado","rechazado","anulado","pagado"])
export function rolRequerido(destino: string): UserRole[]  // grupo actual — se conserva para los otros módulos
```

Seed ya aplicado en la DB (Fase 1): admin `{}` (short-circuit), supervisor=20 permisos
(ver/crear/aprobar/borrar × 6), usuario=12 (ver/crear × 6), readonly=6 (ver × 6).
`gu_roles.permisos: string[]` existe en database.types.ts (Row/Insert/Update).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Cablear las 5 rutas de ordenes_compra con requirePermission (PERM-06)</name>
  <files>
    src/shared/transiciones.ts,
    src/shared/transiciones.test.ts,
    src/app/api/ordenes-compra/route.ts,
    src/app/api/ordenes-compra/[id]/route.ts,
    src/app/api/ordenes-compra/[id]/estado/route.ts,
    src/app/api/ordenes-compra/[id]/lineas/route.ts,
    src/app/api/ordenes-compra/lineas/[lineaId]/route.ts
  </files>
  <action>
    Reemplazo mecánico de `requireRole(GRUPO)` por `requirePermission('ordenes_compra', accion)` SOLO en
    las rutas del módulo ordenes_compra. Mapeo exacto:
    - GET (colección `/route.ts`, `/[id]/route.ts`, `/[id]/lineas/route.ts`): gatear con
      `requirePermission('ordenes_compra','ver')`. (Decisión revisada tras el plan-check: gatear el GET hace que el
      permiso `ver` de la matriz sea REAL y que el E2E valide de verdad la lectura. SIN regresión: los 4 roles del
      sistema tienen `ver` por el seed; solo un rol custom SIN `ver` pierde la lectura de OC — que es exactamente el
      comportamiento RBAC buscado. Nota: hoy esos GET no tenían gate de rol, así que es un endurecimiento intencional.)
    - POST `/route.ts`  → `requirePermission('ordenes_compra','crear')` (era `requireRole(ROLES_ESCRITURA)`).
    - PUT `/[id]/route.ts` → `requirePermission('ordenes_compra','crear')` (era ROLES_ESCRITURA).
    - DELETE `/[id]/route.ts` → `requirePermission('ordenes_compra','borrar')` (era ROLES_DESTRUCTIVO).
    - POST `/[id]/lineas/route.ts` → `requirePermission('ordenes_compra','crear')` (era ROLES_ESCRITURA).
    - PUT y DELETE `/lineas/[lineaId]/route.ts` → `requirePermission('ordenes_compra','crear')` (era ROLES_ESCRITURA
      en AMBOS: borrar línea hoy es escritura, no destructivo — mantener esa semántica → 'crear').
    - PATCH `/[id]/estado/route.ts` → mapear por DESTINO, coherente con `rolRequerido`:
      destino ∈ {aprobado, rechazado, anulado} → 'aprobar'; destino ∈ {en_aprobacion, borrador} → 'crear'.
      Para no duplicar el criterio, agregar en transiciones.ts junto a `rolRequerido` una función hermana
      `accionRequerida(destino: string): "aprobar" | "crear"` que reusa el mismo `REQUIERE_APROBACION`
      (`REQUIERE_APROBACION.has(destino) ? "aprobar" : "crear"`), y en la ruta llamar
      `requirePermission('ordenes_compra', accionRequerida(estado))`. Quitar el import de `rolRequerido` de esa ruta.
    Limpiar imports que queden sin uso en cada archivo (`requireRole`, `ROLES_ESCRITURA`, `ROLES_DESTRUCTIVO`,
    `rolRequerido`). NO tocar `shared/permissions.ts` ni las rutas de los otros 5 módulos.
    Test (obs. plan-check #2): agregar a `src/shared/transiciones.test.ts` 3 asserts de `accionRequerida`:
    'aprobado'→'aprobar', 'anulado'→'aprobar', 'en_aprobacion'→'crear' (cierra el mapeo, es CI-able).
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
    <automated>npx vitest run src/shared/transiciones.test.ts</automated>
    <automated>grep -RE "requireRole|ROLES_ESCRITURA|ROLES_DESTRUCTIVO" src/app/api/ordenes-compra | grep -v '^#' | wc -l  # espera 0</automated>
  </verify>
  <done>
    Las 5 rutas de ordenes_compra usan `requirePermission('ordenes_compra', ...)`; el mapeo
    ver/crear/aprobar/borrar es el descrito; `accionRequerida` existe en transiciones.ts; tsc verde;
    ningún `requireRole`/`ROLES_*` queda en el módulo ordenes_compra; los otros módulos intactos.
  </done>
</task>

<task type="auto">
  <name>Task 2: RolService valida permisos[] contra el catálogo + persistencia (PERM-08 backend)</name>
  <files>
    src/repositories/rol.repository.ts,
    src/controllers/rol.controller.ts,
    src/controllers/rol.controller.test.ts,
    src/app/api/admin/roles/route.ts,
    src/app/api/admin/roles/[id]/route.ts
  </files>
  <action>
    Habilitar guardar/leer `permisos[]` por rol, validado contra el catálogo (nunca confiar en el body).
    - `rol.repository.ts`: en `findAllOrdered` agregar `permisos` al `.select("id, nombre, descripcion, permisos")`
      para que la UI muestre el estado actual de cada rol.
    - `rol.controller.ts` (`RolService`): `create` y `update` aceptan un `permisos?: string[]` opcional. Antes de
      escribir, si viene `permisos`, validar CADA clave con `esPermisoValido(clave)` (import de
      `@/shared/permissions-catalog`); si alguna es inválida → `throw new Error("Permiso inválido: <clave>")`.
      Pasar `permisos` al payload de `RolRepository.insert`/`update` (en insert, default `[]` si no viene).
      GUARDA anti auto-lockout (PERM-08): si el rol objetivo es `admin` (rol.nombre === "admin"), IGNORAR cualquier
      `permisos` entrante (admin pasa siempre por short-circuit; su array es indistinto) — no dejar que un update
      lo toque. Mantener intactas las guardas existentes (roles de sistema no se renombran/borran).
    - `admin/roles/route.ts` (POST) y `admin/roles/[id]/route.ts` (PUT): pasar `permisos: body.permisos` al
      `RolService.create/update`. En el POST el error de "Permiso inválido" debe salir 400 (hoy el catch mapea
      solo "Ya existe"→409, resto→500): agregar `message.includes("Permiso inválido")` al ramo 400/400. En el PUT
      el catch ya manda 400 para errores de negocio; agregar "Permiso inválido" a `esNegocio` para no caer en 500.
      Ambas rutas siguen detrás de `requireAdmin` (no tocar el gate).
    Ponytail: la validación vive en el service (una sola fuente), NO en la ruta cruda. Sin Zod nuevo — un `.every`
    sobre `esPermisoValido` alcanza.
    Test (obs. plan-check #2, path de seguridad): agregar a `src/controllers/rol.controller.test.ts` (mockeando
    RolRepository) que `RolService.create/update` con un `permisos` que contiene una clave fuera del catálogo
    (ej. 'fake:accion') rechaza (throw "Permiso inválido") y NO llama al insert/update del repo; y que un `permisos`
    válido sí persiste.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
    <automated>npx vitest run src/controllers/rol.controller.test.ts</automated>
    <automated>grep -c "esPermisoValido" src/controllers/rol.controller.ts  # espera >=1</automated>
  </verify>
  <done>
    `RolService.create/update` aceptan `permisos[]`, rechazan claves fuera del catálogo (propaga a 400 en ambas
    rutas admin), ignoran `permisos` para el rol admin, y persisten vía repo; `findAllOrdered` devuelve `permisos`;
    tsc verde.
  </done>
</task>

<task type="auto">
  <name>Task 3: Matriz de checkboxes en la tab Roles (PERM-07 + PERM-08 UI)</name>
  <files>
    src/views/rol-permisos-matrix.tsx,
    src/app/(dashboard)/admin/usuarios/page.tsx
  </files>
  <action>
    Nuevo componente `src/views/rol-permisos-matrix.tsx` (client): recibe `{ value: string[], onChange:(v:string[])=>void,
    readOnly?: boolean }`. Renderiza una grilla filas=módulos × columnas=acciones a partir de `PERMISOS_CATALOGO`
    y `ACCION_LABEL`; SOLO pinta checkbox en las celdas cuyo `accion` está en `def.acciones` del módulo (proveedores
    e items no tienen aprobar/borrar → celda vacía). Cada checkbox refleja `value.includes(`${modulo}:${accion}`)` y
    en `onCheckedChange` agrega/quita esa clave del array. `readOnly` → checkboxes `disabled` y siempre tildados
    (para admin). Reusa `Checkbox` (@/views/ui/checkbox), `Card`/`Label` ya importados. Cero deps.

    En `page.tsx`:
    - Extender `interface RolData` con `permisos: string[]`.
    - Extender el dialog "Nuevo rol": sumar `<RolPermisosMatrix value={nuevoRol.permisos} onChange={...}/>` y agregar
      `permisos: []` al estado `nuevoRol`; enviar `permisos` en el POST.
    - AGREGAR un dialog "Editar permisos" (hoy NO existe edición de roles — ver RIESGO): botón por fila de rol
      (icono Shield/pencil) que abre un dialog con `<RolPermisosMatrix>` precargado con `rol.permisos`. Para el rol
      `admin`: `readOnly` + todo-tildado (no editable). Guardar con `PUT /api/admin/roles/${rol.id}` body `{ permisos }`,
      luego `fetchRoles()`. Reusar el patrón `api(...)`/`showSuccessToast`/`saving` ya presentes.
    - Actualizar el texto explicativo del pie (líneas ~415-419) que dice "reciben permisos de usuario hasta que se
      les asigne un mapeo propio": ahora el mapeo se asigna acá con la matriz.
    Ponytail: un solo componente de matriz reusado en crear y editar; no se rediseña la tab, solo se suman matriz +
    dialog de edición.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
    <automated>npm run build</automated>
  </verify>
  <done>
    La tab Roles muestra, por rol, una matriz de checkboxes válida (solo celdas del catálogo); admin sale
    todo-tildado y disabled; crear y editar roles guardan `permisos[]` vía la API admin; build verde.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Verificación E2E del slice + piso verde (PERM-10)</name>
  <what-built>
    ordenes_compra autoriza por permiso; matriz de roles editable; RolService valida el catálogo.
  </what-built>
  <how-to-verify>
    Piso automático (correr y confirmar verde):
      1. `npx tsc --noEmit`
      2. `npm run build`
      3. `npm test`  → la suite existente NO debe romperse (piso: el conteo actual de `npm test`; el seed replica
         el comportamiento previo, así que 0 regresiones esperadas).
    E2E por HTTP (necesita dev server + DB "Gestion Uno v2" con el circuito demo):
      4. `npm run dev` en otra terminal.
      5. En la tab Roles (/admin/usuarios) crear un rol custom "solo_lectura_oc" y tildar ÚNICAMENTE
         `ordenes_compra:ver`. Crear un usuario con ese rol (o asignárselo) y loguearse como él.
      6. Como ese usuario: `GET /api/ordenes-compra` → 200 (lista). `POST /api/ordenes-compra` con un body válido
         → 403. `PATCH /api/ordenes-compra/<id>/estado {estado:"en_aprobacion"}` → 403.
         `PATCH .../estado {estado:"aprobado"}` → 403. `DELETE /api/ordenes-compra/<id>` → 403.
      7. Login como supervisor: las mismas 4 operaciones → 200/201 (acceso completo intacto).
      8. En la tab Roles: el rol admin se ve todo-tildado y no editable. Intentar guardar un rol con una clave
         basura (ej. via devtools mandar `permisos:["fake:accion"]`) → 400.
    Confirmar cada resultado esperado.
  </how-to-verify>
  <resume-signal>Escribí "approved" si todo dio como se espera, o describí qué status no coincidió.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client → API (/api/ordenes-compra/*) | request de usuario autenticado cruza a la lógica de negocio; el rol/permiso decide acceso |
| client → API (/api/admin/roles/*) | admin edita permisos de roles; el body `permisos[]` es input no confiable |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-01 | Elevation of Privilege | rutas ordenes_compra | mitigate | `requirePermission('ordenes_compra', accion)` resuelve permisos frescos por request (sin staleness de JWT); 403 si falta |
| T-02-02 | Tampering | body `permisos[]` en admin/roles POST/PUT | mitigate | `esPermisoValido` valida CADA clave en RolService antes de escribir → 400; no se confía en el body |
| T-02-03 | Elevation of Privilege | rol admin | mitigate | admin short-circuit en `tienePermiso` + UI read-only + RolService ignora `permisos` entrante para admin (anti auto-lockout) |
| T-02-04 | Elevation of Privilege | edición de permisos | mitigate | `PUT /api/admin/roles/[id]` sigue detrás de `requireAdmin` (solo admin edita roles) |
| T-02-SC | Tampering | supply chain | accept | cero deps nuevas en esta fase — no hay instalación de paquetes |
</threat_model>

<verification>
- `npx tsc --noEmit` verde.
- `npm run build` verde.
- `npm test` sin regresión (piso: conteo actual de la suite; el seed replica el comportamiento previo → 0 regresiones esperadas).
- E2E HTTP: rol custom `ordenes_compra:ver` → GET 200 / crear·aprobar·borrar 403; supervisor → acceso completo; permiso basura → 400; admin no editable.
- Ningún `requireRole`/`ROLES_*` queda en `src/app/api/ordenes-compra`; los otros 5 módulos sin cambios.
</verification>

<success_criteria>
1. Rutas de ordenes_compra autorizan por `requirePermission` con el mapeo ver/crear/aprobar/borrar; los otros módulos siguen con `requireRole`. (PERM-06)
2. Matriz de checkboxes (módulos × acciones, solo celdas válidas) editable en la tab Roles; guarda `permisos[]` vía API admin. (PERM-07)
3. admin todo-tildado y no editable; RolService rechaza 400 claves fuera del catálogo; guarda anti auto-lockout. (PERM-08)
4. Rol custom con solo `ordenes_compra:ver` lista pero recibe 403 en crear/aprobar/borrar; supervisor intacto. (PERM-10)
5. Piso verde: tsc + build + suite existente sin regresión.
</success_criteria>

<output>
Create `.planning/phases/02-slice-ordenes-compra-ui/02-01-SUMMARY.md` when done
</output>
