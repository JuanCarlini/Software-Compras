# RBAC Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que la matriz de permisos sea autoritativa en todo el sistema (API + páginas + sidebar), con una regla dura que impida rutas mutantes sin gate.

**Architecture:** Defensa en profundidad, sin tocar el JWT. La API sigue siendo la fuente de verdad (`requirePermission`, permisos frescos de la DB por request). Se agregan guardas server-side en las páginas (`requirePagePermission` → redirect), gateado del sidebar por permiso, y un test que escanea las rutas y falla si una ruta mutante no tiene gate.

**Tech Stack:** Next.js 15 (App Router), TypeScript, vitest, Supabase (service_role), JWT custom.

## Global Constraints

- Cada tarea cierra con `npx tsc --noEmit` + `npx vitest run` + (donde toque UI/rutas) `npx next build`, todo verde. Commit atómico por tarea.
- No tocar el JWT. No embeber permisos en el token. No middleware de permisos en el edge.
- Reusar lo existente: `tienePermiso(rolNombre, permisos, modulo, accion)` (pura), `RolRepository.findPermisosByNombre(rol)`, `getAuthenticatedUser()`, `requirePermission`. No crear abstracciones nuevas.
- Módulos de matriz válidos: `ordenes_compra`, `certificaciones`, `facturas`, `ordenes_pago`, `proveedores`, `items`. Acciones: `ver`, `crear`, `aprobar`, `borrar` (proveedores/items solo ver/crear).
- Sin push a git.

---

### Task 1: Migrar `proveedores` a la matriz (requirePermission)

**Files:**
- Modify: `src/app/api/proveedores/route.ts` (GET+POST)
- Modify: `src/app/api/proveedores/[id]/route.ts` (GET+PUT+DELETE)
- Modify: `src/app/api/proveedores/[id]/activar/route.ts` (PATCH)
- Modify: `src/app/api/proveedores/[id]/suspender/route.ts` (PATCH)

**Interfaces:**
- Consumes: `requirePermission(modulo: string, accion: string): Promise<{ error: NextResponse | null, user: {...} | null }>` de `@/shared/permissions-server`.
- Produces: nada nuevo (solo cambia el gate de estas rutas).

Mapeo: GET → `requirePermission("proveedores","ver")`; POST/PUT/activar/suspender/DELETE → `requirePermission("proveedores","crear")`. Reemplaza `requireRole(ROLES_*)` y `canModificarProveedor(...)` inline.

- [ ] **Step 1:** En cada archivo, cambiar el import: quitar `requireRole`/`ROLES_*`/`canModificarProveedor` sin uso; agregar `import { requirePermission } from "@/shared/permissions-server"`.
- [ ] **Step 2:** `proveedores/route.ts` — el POST usa `createRoute`: cambiar `autorizar: () => requireRole(ROLES_ESCRITURA)` → `autorizar: () => requirePermission("proveedores", "crear")`. Si el GET no tiene gate, agregar al inicio del try: `const { error: authError } = await requirePermission("proveedores", "ver"); if (authError) return authError`.
- [ ] **Step 3:** `proveedores/[id]/route.ts` — GET (getByIdRoute): agregar `autorizar: () => requirePermission("proveedores", "ver")`. PUT: `requireRole(ROLES_ESCRITURA)` → `requirePermission("proveedores", "crear")`. DELETE: `requireRole(ROLES_DESTRUCTIVO)` → `requirePermission("proveedores", "crear")`.
- [ ] **Step 4:** `activar/route.ts` y `suspender/route.ts` — reemplazar el bloque `requireAuth()` + `canModificarProveedor(stringToUserRole(user.rol))` por `const { error: authError, user } = await requirePermission("proveedores", "crear"); if (authError) return authError`. Ajustar el mensaje de 403 (ya lo maneja requirePermission).
- [ ] **Step 5:** Verificar: `grep -rn "requireRole\|ROLES_\|canModificarProveedor" src/app/api/proveedores` → 0 resultados de código.
- [ ] **Step 6:** Gate: `npx tsc --noEmit` (0) · `npx vitest run` (verde). Commit: `fix(seguridad): proveedores consulta la matriz (requirePermission)`.

---

### Task 2: Helper `requirePagePermission` (TDD)

**Files:**
- Modify: `src/shared/permissions-server.ts` (agregar la función)
- Modify: `src/shared/permissions-server.test.ts` (tests)

**Interfaces:**
- Consumes: `getAuthenticatedUser()`, `RolRepository.findPermisosByNombre(rol)`, `tienePermiso(rol, permisos, modulo, accion)`, `redirect` de `next/navigation`.
- Produces: `requirePagePermission(modulo: string, accion: string, fallbackUrl?: string): Promise<{ user: {...} }>` — para Server Components. Sin usuario → `redirect("/login")`; sin permiso → `redirect(fallbackUrl ?? "/dashboard")`; con permiso → devuelve `{ user }`.

- [ ] **Step 1: Escribir los tests que fallan.** En `permissions-server.test.ts`, agregar `vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("REDIRECT") }) }))` y un mock de `RolRepository.findPermisosByNombre`. Tests:

```ts
import { redirect } from "next/navigation"
const redirectMock = vi.mocked(redirect)

describe("requirePagePermission", () => {
  it("redirige a /login sin usuario", async () => {
    getUser.mockResolvedValue(null as any)
    await expect(requirePagePermission("certificaciones", "ver")).rejects.toThrow()
    expect(redirectMock).toHaveBeenCalledWith("/login")
  })
  it("redirige al fallback si el rol no tiene el permiso", async () => {
    comoRol("usuario")
    rolRepo.findPermisosByNombre.mockResolvedValue([]) // usuario sin nada tildado en el mock
    await expect(requirePagePermission("certificaciones", "crear", "/certificaciones")).rejects.toThrow()
    expect(redirectMock).toHaveBeenCalledWith("/certificaciones")
  })
  it("devuelve el usuario si tiene el permiso", async () => {
    comoRol("usuario")
    rolRepo.findPermisosByNombre.mockResolvedValue(["certificaciones:crear"])
    const { user } = await requirePagePermission("certificaciones", "crear")
    expect(user.rol).toBe("usuario")
  })
  it("admin pasa siempre (short-circuit)", async () => {
    comoRol("admin")
    rolRepo.findPermisosByNombre.mockResolvedValue([])
    const { user } = await requirePagePermission("facturas", "aprobar")
    expect(user.rol).toBe("admin")
  })
})
```

(Nota: `getUser`, `comoRol`, `rolRepo` ya existen en el archivo del test A3; reusarlos. `redirect` mockeado tira para cortar el flujo como en runtime.)

- [ ] **Step 2:** Correr `npx vitest run src/shared/permissions-server.test.ts` → FALLA (requirePagePermission no existe).
- [ ] **Step 3: Implementar.** En `permissions-server.ts`:

```ts
import { redirect } from "next/navigation"
import { RolRepository } from "@/repositories/rol.repository"

/**
 * Guarda de PÁGINA (Server Components). Equivalente de requirePermission para páginas:
 * si no hay usuario redirige a /login; si el rol no tiene `modulo:accion`, redirige al
 * fallback (default /dashboard). Permisos frescos por request (sin staleness).
 */
export async function requirePagePermission(modulo: string, accion: string, fallbackUrl = "/dashboard") {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/login")
  const permisos = await RolRepository.findPermisosByNombre(user!.rol)
  if (!tienePermiso(user!.rol, permisos, modulo, accion)) redirect(fallbackUrl)
  return { user: user! }
}
```

(`tienePermiso` ya está importado en el archivo; `getAuthenticatedUser` es local.)

- [ ] **Step 4:** `npx vitest run src/shared/permissions-server.test.ts` → PASA. `npx tsc --noEmit` → 0.
- [ ] **Step 5: Commit:** `feat(seguridad): requirePagePermission (guarda server-side de páginas)`.

---

### Task 3: Guardar las páginas del circuito (lists, nueva, detalles)

**Files (Modify):** las 3 variantes por módulo (5 módulos: certificaciones, facturas, ordenes-pago, ordenes-compra, proveedores):
- `<modulo>/page.tsx` (lista) → `ver`
- `<modulo>/nueva|nuevo/page.tsx` (crear) → `crear`, fallback = la lista
- `<modulo>/[id]/page.tsx` (detalle) → `ver`

**Interfaces:**
- Consumes: `requirePagePermission(modulo, accion, fallbackUrl?)` de Task 2.

Mapeo modulo por ruta: certificaciones→`certificaciones`, facturas→`facturas`, ordenes-pago→`ordenes_pago`, ordenes-compra→`ordenes_compra`, proveedores→`proveedores`.

- [ ] **Step 1 — Listas.** Cada `<modulo>/page.tsx` ya es Server Component. Volverlo `async` y guardar al inicio. Patrón (certificaciones):

```tsx
import { CertificacionesList } from "@/views/certificaciones-list"
import { CrearButton } from "@/views/crear-button"
import { requirePagePermission } from "@/shared/permissions-server"

export default async function CertificacionesPage() {
  await requirePagePermission("certificaciones", "ver")
  return ( /* …igual que ahora… */ )
}
```
Repetir en facturas (`"facturas"`), ordenes-pago (`"ordenes_pago"`), ordenes-compra (`"ordenes_compra"`), proveedores (`"proveedores"`).

- [ ] **Step 2 — Nueva.** Cada `<modulo>/nueva/page.tsx` hoy es `"use client"` y solo renderiza el form + header. Convertir a Server Component async con guarda. Patrón (certificaciones/nueva):

```tsx
import { CertificacionForm } from "@/views/certificacion-form"
import { requirePagePermission } from "@/shared/permissions-server"

export default async function NuevaCertificacionPage() {
  await requirePagePermission("certificaciones", "crear", "/certificaciones")
  return (
    <div className="space-y-6">
      { /* …el mismo header + <CertificacionForm /> que ya estaba… */ }
    </div>
  )
}
```
Quitar `"use client"` (el form ya es client). Repetir en las 4 nueva del circuito + `proveedores/nuevo` (fallback `/proveedores`, permiso `crear`).

- [ ] **Step 3 — Detalles.** Cada `<modulo>/[id]/page.tsx` renderiza un componente de detalle client. Convertir la page a Server Component async, guardar `ver`, y pasarle los params al componente. Verificar primero si la page es client (`head -1`); si lo es, sacar `"use client"` y mover cualquier hook client al componente hijo (que ya es client). Patrón:

```tsx
import { CertificacionDetail } from "@/views/certificacion-detail"
import { requirePagePermission } from "@/shared/permissions-server"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("certificaciones", "ver")
  return <CertificacionDetail params={params} />
}
```
Adaptar a la firma real de cada detail (algunos toman `ordenId`/`params`). Repetir en los 5 módulos.

- [ ] **Step 4:** Gate: `npx tsc --noEmit` (0) · `npx vitest run` (verde) · `npx next build` (verde — confirma que las conversiones server/client no rompen el render).
- [ ] **Step 5: Commit:** `feat(seguridad): guardas server-side en las páginas del circuito (requirePagePermission)`.

---

### Task 4: Sidebar gateado por permiso

**Files:**
- Modify: `src/views/app-sidebar.tsx`

**Interfaces:**
- Consumes: `puede(modulo, accion)` del auth-context (ya existe).

- [ ] **Step 1:** Agregar `modulo?: string` a cada item de `menuItems` del circuito (Dashboard y Reportes sin `modulo`):

```ts
const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Órdenes de Compra", url: "/ordenes-compra", icon: ShoppingCart, modulo: "ordenes_compra" },
  { title: "Certificaciones", url: "/certificaciones", icon: FileCheck, modulo: "certificaciones" },
  { title: "Facturas", url: "/facturas", icon: Receipt, modulo: "facturas" },
  { title: "Órdenes de Pago", url: "/ordenes-pago", icon: CreditCard, modulo: "ordenes_pago" },
  { title: "Proveedores", url: "/proveedores", icon: Building2, modulo: "proveedores" },
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
]
```

- [ ] **Step 2:** En `AppSidebar`, sacar `puede` del contexto y filtrar antes de mapear:

```tsx
const { user, puede } = useAuth()
const visibles = menuItems.filter((item) => !item.modulo || puede(item.modulo, "ver"))
```
Cambiar `{menuItems.map(...)}` por `{visibles.map(...)}`. Quitar `isAdmin`/`stringToUserRole`/`userRole`/`userIsAdmin` solo si dejan de usarse — OJO: `userIsAdmin` gatea la sección Admin, así que se mantiene.

- [ ] **Step 3:** Gate: `npx tsc --noEmit` (0) · `npx next build` (verde). Commit: `feat(seguridad): sidebar oculta módulos sin permiso de ver`.

---

### Task 5: Regla dura enforced — test de autorización de rutas (TDD)

**Files:**
- Create: `src/app/api/route-authz.test.ts`

**Interfaces:** ninguno (test standalone). Lee los archivos de ruta del filesystem.

- [ ] **Step 1: Escribir el test.**

```ts
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { globSync } from "node:fs" // si no está, usar fast-glob ya presente o readdir recursivo

// Rutas públicas/self intencionales (sin gate de permiso a propósito).
const ALLOWLIST = ["auth/login/route.ts", "auth/logout/route.ts"]
// Un método mutante debe referenciar alguno de estos gates.
const GATES = /requirePermission|requireRole|requireAdmin|createRoute|estadoRoute/
const MUTATING = /export\s+(async\s+function|const)\s+(POST|PUT|PATCH|DELETE)/

describe("regla dura: toda ruta mutante tiene gate de autorización", () => {
  const files = /* listar src/app/api/**/route.ts */ []
  it.each(files)("%s", (file) => {
    const rel = file.split("src/app/api/")[1]
    if (ALLOWLIST.includes(rel)) return
    const src = readFileSync(file, "utf8")
    if (MUTATING.test(src)) {
      expect(src, `${rel} tiene un método mutante sin gate`).toMatch(GATES)
    }
  })
})
```

Para listar los archivos sin dependencia nueva: usar un walk recursivo con `node:fs` (`readdirSync` con `recursive: true` en Node 20+, o una función recursiva). Resolver la ruta base con `import.meta.url` o `process.cwd()` + `"src/app/api"`.

- [ ] **Step 2:** Correr `npx vitest run src/app/api/route-authz.test.ts`. Debe PASAR (después de Task 1 no queda ninguna ruta mutante sin gate). Si falla, señala una ruta real sin gate → arreglarla (no relajar el test).
- [ ] **Step 3: Verificación negativa (confianza en el test):** temporalmente quitar el gate de una ruta mutante cualquiera y confirmar que el test FALLA; revertir. (No commitear la ruta rota.)
- [ ] **Step 4: Commit:** `test(seguridad): regla dura — toda ruta mutante debe tener gate de autorización`.

---

### Task 6: Documentar la regla dura en CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (sección de Auth/permisos)

- [ ] **Step 1:** Agregar en la sección de Auth un bullet de regla dura:

> **Regla dura de seguridad (enforced):** toda ruta mutante (POST/PUT/PATCH/DELETE) DEBE tener gate de autorización — preferido `requirePermission(modulo, accion)`; las factories `createRoute`/`estadoRoute` ya lo llevan. Toda página del circuito DEBE llamar `requirePagePermission(modulo, accion)` (ver → listas/detalles, crear → nueva). Lo enforcea `src/app/api/route-authz.test.ts` (falla el build si una ruta mutante queda sin gate). La matriz de permisos (`permissions-catalog`) es autoritativa para OC/CE/FACT/OP/proveedores/items; el sidebar y los botones se ocultan por `puede(modulo, "ver"/"crear"/…)`.

- [ ] **Step 2:** Agregar entrada al Changelog de sesiones resumiendo el hardening.
- [ ] **Step 3: Commit:** `docs: regla dura de seguridad (autorización de rutas + guardas de página)`.

---

## Self-Review

- **Spec coverage:** Task 1 = componente 4 (proveedores). Task 2 = componente 1 (requirePagePermission). Task 3 = componente 2 (guardas de página). Task 4 = componente 3 (sidebar). Task 5 = componente 5 (test enforced). Task 6 = componente 6 (doc). Todos los componentes del spec tienen tarea. ✓
- **Placeholders:** el código de las páginas se muestra por patrón + lista de archivos (repetición mecánica idéntica salvo el string de módulo/fallback); el helper y los tests van con código completo. ✓
- **Type consistency:** `requirePagePermission(modulo, accion, fallbackUrl?)` se define en Task 2 y se consume igual en Task 3. `puede(modulo, accion)` ya existe. ✓
