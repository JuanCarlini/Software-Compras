---
phase: 01-mecanismo-de-permisos
plan: 01
type: execute
wave: 1
depends_on: []                # Precondición EXTERNA (sesión Supabase) para Task 4 — no es un plan GSD
files_modified:
  - src/shared/permissions-catalog.ts        # nuevo
  - src/shared/permissions.ts                # + tienePermiso
  - src/shared/permissions.test.ts           # nuevo
  - src/repositories/rol.repository.ts       # + findPermisosByNombre
  - src/shared/permissions-server.ts         # + requirePermission
  - .planning/phases/01-mecanismo-de-permisos/SCHEMA_HANDOFF.md   # entregable para la sesión Supabase
autonomous: false             # Task 1 es checkpoint:human-action (sesión Supabase externa)
requirements: [PERM-01, PERM-02, PERM-03, PERM-04, PERM-05, PERM-09]

must_haves:
  truths:
    - "El catálogo enumera las ~20 claves modulo:accion válidas y valida que un permisos[] solo contenga claves legítimas."
    - "tienePermiso(rolNombre, permisos, modulo, accion) es función pura (sin DB) y está cubierta por tests unit."
    - "Un rol admin pasa siempre, incluso con permisos vacíos (short-circuit)."
    - "requirePermission(modulo, accion) resuelve los permisos del rol por request y devuelve 403 si falta el permiso, con shape { error, user }."
    - "El DDL + los sets de seed de los 4 roles están especificados exactos como hand-off para la sesión Supabase."
  artifacts:
    - path: "src/shared/permissions-catalog.ts"
      provides: "Catálogo ~20 claves modulo:accion + etiquetas + agrupación por módulo + validación"
      contains: "PERMISOS_CATALOGO"
    - path: "src/shared/permissions.ts"
      provides: "tienePermiso pura (admin short-circuit + membership)"
      contains: "export function tienePermiso"
    - path: "src/shared/permissions.test.ts"
      provides: "Tests unit del chequeo puro"
      contains: "tienePermiso"
    - path: "src/shared/permissions-server.ts"
      provides: "requirePermission per-request contra gu_roles.permisos"
      contains: "export async function requirePermission"
    - path: "src/repositories/rol.repository.ts"
      provides: "findPermisosByNombre (I/O de gu_roles.permisos)"
      contains: "findPermisosByNombre"
    - path: ".planning/phases/01-mecanismo-de-permisos/SCHEMA_HANDOFF.md"
      provides: "DDL + seed exactos para la sesión Supabase"
      contains: "ALTER TABLE gu_roles"
  key_links:
    - from: "src/shared/permissions-server.ts (requirePermission)"
      to: "RolRepository.findPermisosByNombre"
      via: "resuelve permisos frescos del rol por request"
      pattern: "findPermisosByNombre"
    - from: "src/shared/permissions-server.ts (requirePermission)"
      to: "tienePermiso"
      via: "delega el chequeo puro (incl. admin short-circuit)"
      pattern: "tienePermiso\\("
---

<objective>
Construir el MECANISMO de RBAC real (puro código + el contrato de schema del que depende),
verificable en aislamiento: un rol tiene su conjunto de permisos `modulo:accion` en
`gu_roles.permisos` y la autorización los chequea frescos por request, con short-circuit de
admin. NO se cablea ningún módulo ni la UI (eso es Fase 2).

Purpose: convertir "crear un rol es cosmético" en RBAC real, sin cambiar el acceso de ningún
usuario existente (el seed replica la autorización actual 1:1).
Output: catálogo en código, `tienePermiso` pura testeada, `requirePermission` server-side,
y el hand-off de DDL+seed para la sesión Supabase.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@docs/superpowers/specs/2026-07-20-roles-permisos-design.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md

<interfaces>
<!-- Contratos que el executor necesita. Extraídos del código; no explorar de más. -->

src/shared/permissions.ts (existente — patrón a reusar):
```typescript
import { UserRole } from "@/models"
export function isAdmin(userRole: UserRole): boolean
export function stringToUserRole(rol: string): UserRole   // 'admin'|'supervisor'|'readonly'|else→USUARIO
export const ROLES_ESCRITURA / ROLES_DESTRUCTIVO / ROLES_APROBACION: UserRole[]  // NO tocar en Fase 1
```

src/shared/permissions-server.ts (existente — requirePermission calca este shape):
```typescript
export async function getAuthenticatedUser(): Promise<{ id:number; email:string; nombre:string; rol:string } | null>
// rol = user.rol_nombre.toLowerCase() (nombre del rol, ej. 'supervisor'); NO trae permisos
export async function requireAuth(): Promise<{ error: NextResponse|null; user: {...}|null }>
export async function requireRole(roles: UserRole[]): Promise<{ error, user }>   // devolver mismo shape
```

src/repositories/rol.repository.ts (existente — I/O de gu_roles, ÚNICA capa con .from()):
```typescript
import { createClient } from "@/lib/supabase/service"
class RolRepository {
  static async findById(id): Promise<{id:number;nombre:string}|null>
  static async update(id, payload: TablesUpdate<"gu_roles">): Promise<any>
  // añadir: findPermisosByNombre(nombre): Promise<string[]>
}
```

gu_roles Row HOY (database.types.ts): { id:number; nombre:string; descripcion:string|null; creado_en:string|null }
→ la columna `permisos text[]` NO existe todavía. La agrega la sesión Supabase (Task 1) y
regenera database.types.ts. Task 4 (requirePermission + repo) queda GATEADA tras eso.
</interfaces>
</context>

<tasks>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 1: PRECONDICIÓN EXTERNA — schema gu_roles.permisos (sesión Supabase MCP)</name>
  <what-built>
    Regla dura del proyecto: el código NO toca Supabase. Esta tarea NO la ejecuta el executor
    de código: se ejecuta en una sesión separada con el MCP de Supabase. El executor de código
    SOLO produce el hand-off `SCHEMA_HANDOFF.md` (abajo) y luego espera.
  </what-built>
  <files>.planning/phases/01-mecanismo-de-permisos/SCHEMA_HANDOFF.md (lo escribe el executor de código)</files>
  <action>
    Escribir SCHEMA_HANDOFF.md con el contrato EXACTO para la sesión Supabase. Contenido literal:

    (1) DDL:
        ALTER TABLE gu_roles ADD COLUMN permisos text[] NOT NULL DEFAULT '{}';

    (2) Seed de los 4 roles del sistema (replica la autorización actual 1:1; claves = catálogo
        de Task 2, 20 pares válidos: los 4 módulos de workflow con las 4 acciones + proveedores
        e items con ver/crear):
        - admin      → '{}'  (acceso por short-circuit en requirePermission; array vacío a
                              propósito — una sola fuente de verdad, sin duplicado stale-able).
        - supervisor → los 20 pares (ver/crear/aprobar/borrar en ordenes_compra, certificaciones,
                              facturas, ordenes_pago; ver/crear en proveedores, items).
        - usuario    → ver+crear en los 6 módulos = 12 pares.
        - readonly   → ver en los 6 módulos = 6 pares.
        Escribir cada UPDATE con el array de literales completo (no abreviar), p. ej.:
        UPDATE gu_roles SET permisos = ARRAY['ordenes_compra:ver','ordenes_compra:crear', ...] WHERE nombre='usuario';

    (3) Regenerar tipos: `generate_typescript_types` → sobreescribir src/lib/supabase/database.types.ts
        (gu_roles Row/Insert/Update deben incluir `permisos: string[]`).

    (4) Nota de precondición: Task 4 de este plan NO compila (tsc) hasta que este paso esté
        aplicado y los tipos regenerados. Tasks 2 y 3 NO dependen de la DB y van primero.
  </action>
  <verify>
    <automated>MISSING — verificación humana: la sesión Supabase confirma columna creada + seed aplicado + database.types.ts regenerado con `permisos: string[]` en gu_roles.</automated>
    <human-check>La sesión Supabase reporta: SELECT nombre, permisos FROM gu_roles → los 4 roles con los sets esperados; y database.types.ts contiene `permisos: string[]`.</human-check>
  </verify>
  <resume-signal>Escribir "schema aplicado" cuando la columna + seed + tipos estén listos. Recién ahí desbloquear Task 4.</resume-signal>
  <done>SCHEMA_HANDOFF.md existe con DDL+seed+regen exactos; la sesión Supabase aplicó la columna, sembró los 4 roles y regeneró database.types.ts con `permisos: string[]`.</done>
</task>

<task type="auto">
  <name>Task 2: Catálogo de permisos en código (PERM-01)</name>
  <files>src/shared/permissions-catalog.ts</files>
  <action>
    Crear el catálogo estático (PERM-01). Sin DB, importable desde cliente y server.
    - Definir los 6 módulos y las 4 acciones. Declarar los PARES VÁLIDOS (~20): los 4 módulos
      de workflow (ordenes_compra, certificaciones, facturas, ordenes_pago) con las 4 acciones
      (ver/crear/aprobar/borrar); proveedores e items con solo ver/crear. Total 20.
    - Estructura mínima: un objeto/array `PERMISOS_CATALOGO` que mapee módulo → acciones válidas,
      con etiqueta legible por módulo y por acción (para la matriz de Fase 2). Reusar tipos
      simples (string unions), sin clases ni abstracciones.
    - Exportar helper `esPermisoValido(clave: string): boolean` (clave `modulo:accion` está en el
      catálogo) y un derivado `PERMISOS_VALIDOS: Set<string>` (o array) para O(1). El validador
      lo consumirá RolService en Fase 2; acá solo se define y testea implícitamente.
    - Exportar el helper que la UI de Fase 2 usará (módulos → acciones disponibles) — es el mismo
      `PERMISOS_CATALOGO`; no crear API extra especulativa.
    NO tocar los grupos ROLES_* de permissions.ts (siguen vivos para los 98 sitios con requireRole).
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
    <note>El comportamiento runtime de esPermisoValido (válido→true, fuera-de-catálogo→false, malformada→false) se asserta en permissions.test.ts (Task 3), no solo con tsc.</note>
  </verify>
  <done>permissions-catalog.ts exporta PERMISOS_CATALOGO (20 pares válidos), esPermisoValido y el índice de claves; tsc verde. `esPermisoValido('ordenes_compra:ver')`→true, `esPermisoValido('proveedores:aprobar')`→false, `esPermisoValido('foo:bar')`→false (verificado por assert en Task 3).</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: tienePermiso pura + tests unit (PERM-05 lógica, PERM-09)</name>
  <files>src/shared/permissions.ts, src/shared/permissions.test.ts</files>
  <behavior>
    tienePermiso(rolNombre: string, permisos: string[], modulo: string, accion: string): boolean
    - Test admin→todo: tienePermiso('admin', [], 'ordenes_compra', 'borrar') === true (array vacío igual pasa).
    - Test tiene: tienePermiso('supervisor', ['ordenes_compra:ver'], 'ordenes_compra', 'ver') === true.
    - Test no-tiene: tienePermiso('readonly', ['ordenes_compra:ver'], 'ordenes_compra', 'crear') === false.
    - Test readonly→solo ver: tienePermiso('readonly', ['ordenes_compra:ver'], 'ordenes_compra', 'ver') === true y crear/aprobar/borrar === false.
    - Test clave inexistente: modulo/accion que no forman un par del array → false (no rompe).
    - Test catálogo (obs. plan-checker #1): esPermisoValido('ordenes_compra:ver')===true,
      esPermisoValido('proveedores:aprobar')===false (par no declarado), esPermisoValido('foo:bar')===false (malformada).
  </behavior>
  <action>
    Añadir a permissions.ts la función PURA (sin DB, sin NextResponse) `tienePermiso`:
    short-circuit `rolNombre.toLowerCase() === 'admin'` → true (PERM-05); si no, membership
    `permisos.includes(`${modulo}:${accion}`)`. Es la única lógica de decisión; requirePermission
    (Task 4) la envuelve con el I/O. Reusar el estilo del archivo (funciones exportadas simples).
    Tests colocados en src/shared/permissions.test.ts (patrón existente: parse-id.test.ts, totales.test.ts).
  </action>
  <verify>
    <automated>npx vitest run src/shared/permissions.test.ts</automated>
  </verify>
  <done>tienePermiso exportada y pura; permissions.test.ts cubre los casos del behavior (tiene/no-tiene/admin→todo/readonly→solo-ver/clave-inexistente + los 3 asserts de esPermisoValido del catálogo) y pasa; el resto de la suite sin tocar.</done>
</task>

<task type="auto">
  <name>Task 4: requirePermission + repo I/O (PERM-04, PERM-05) — GATEADA por Task 1</name>
  <files>src/repositories/rol.repository.ts, src/shared/permissions-server.ts</files>
  <action>
    PRECONDICIÓN: Task 1 aplicada (columna `permisos` existe y database.types.ts regenerado).
    Sin eso, `.select("permisos")` no tipa y tsc rompe.

    (a) rol.repository.ts: añadir `findPermisosByNombre(nombre: string): Promise<string[]>` —
        SELECT permisos FROM gu_roles WHERE nombre = ? (maybeSingle). Devuelve `data?.permisos ?? []`.
        Única capa con .from() (A1). No poner lógica de decisión acá.
    (b) permissions-server.ts: añadir `requirePermission(modulo, accion)` (PERM-04):
        - `const { error, user } = await requireAuth(); if (error) return { error, user: null }`
          (reusar requireAuth existente; NO reimplementar la auth).
        - Resolver permisos frescos por request: `const permisos = await RolRepository.findPermisosByNombre(user.rol)`.
          Per-request ⇒ sin staleness de JWT ni re-login (spec).
        - `if (!tienePermiso(user.rol, permisos, modulo, accion))` → 403 con el mismo shape/mensaje
          que requireRole: `{ error: NextResponse.json({ error: "No tenés permisos..." }, { status: 403 }), user: null }`.
        - Éxito: `{ error: null, user }`. Admin short-circuit ya vive en tienePermiso (PERM-05):
          para admin la query es inocua pero pasa aunque devuelva [].
        NO cablear ninguna ruta (eso es Fase 2). Solo definir el helper.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npx vitest run</automated>
  </verify>
  <done>findPermisosByNombre en el repo; requirePermission en permissions-server.ts con shape { error, user } idéntico a requireRole, 403 si falta permiso, admin pasa; tsc verde (tipos ya incluyen permisos) y la suite completa verde.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| cliente → API route | El cliente decide qué acción invoca; la autorización (requirePermission) es el punto de control server-side. |
| body de PUT/POST rol → gu_roles.permisos | permisos[] llega del cliente (Fase 2); no confiar en su contenido. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Elevation of Privilege | requirePermission / gu_roles.permisos | mitigate | Permisos resueltos server-side por request contra la DB (no desde el JWT/cliente); 403 si falta la clave. |
| T-01-02 | Spoofing / lockout | admin short-circuit | mitigate | admin siempre pasa (PERM-05) aun con array vacío; imposible auto-lockear al sistema editando permisos. |
| T-01-03 | Tampering | permisos[] en el body de rol | mitigate (código en Fase 1, uso en Fase 2) | `esPermisoValido`/catálogo del catálogo (Task 2) para rechazar claves fuera de catálogo cuando RolService escriba (Fase 2). |
| T-01-SC | Tampering (supply chain) | instalación de paquetes | N/A | Cero deps nuevas (regla ponytail); sin superficie de supply-chain en esta fase. |
</threat_model>

<verification>
## Verificación de la fase (comandos + qué demuestra cada criterio del ROADMAP)

Comandos:
- `npx tsc --noEmit` → tipa todo (incl. gu_roles.permisos ya en database.types.ts tras Task 1).
- `npx vitest run` → suite completa. **Piso: los 142 tests existentes siguen verdes** + los nuevos de permissions.test.ts. Cero regresión (el seed replica el comportamiento actual; ninguna ruta cambia de enforcement en Fase 1).
- `npx vitest run src/shared/permissions.test.ts` → aísla el chequeo puro.

Mapeo criterio de éxito ROADMAP → evidencia:
1. Catálogo enumera ~20 claves + valida claves legítimas → `permissions-catalog.ts` (Task 2), `esPermisoValido` en tsc/uso.
2. Cada rol persiste permisos en gu_roles.permisos; 4 roles del sistema con sets que replican hoy → SCHEMA_HANDOFF.md aplicado por sesión Supabase (Task 1); SELECT de verificación humana.
3. requirePermission resuelve por request y 403 si falta, shape { error, user } → `requirePermission` (Task 4), tsc verde con el shape idéntico a requireRole.
4. admin pasa siempre aun con array vacío → `tienePermiso` short-circuit (Task 3), test unit admin→todo.
5. tienePermiso cubierto por tests (tiene/no-tiene, admin→todo, readonly→solo ver, clave inexistente) → permissions.test.ts (Task 3), 5 casos.
</verification>

<success_criteria>
- SCHEMA_HANDOFF.md con DDL + seed exactos entregado (Task 1); sesión Supabase aplicó columna+seed+regen tipos.
- permissions-catalog.ts con 20 pares válidos + validador (PERM-01).
- tienePermiso pura + permissions.test.ts verde (PERM-05 lógica, PERM-09).
- requirePermission + findPermisosByNombre, shape { error, user }, admin short-circuit (PERM-04, PERM-05).
- `tsc --noEmit` verde y `vitest run` con los 142 tests previos + los nuevos en verde.
- Cero deps nuevas; grupos ROLES_* y las 98 rutas con requireRole intactos (Fase 2 los migra).
</success_criteria>

<output>
Create `.planning/phases/01-mecanismo-de-permisos/01-01-SUMMARY.md` when done
</output>
