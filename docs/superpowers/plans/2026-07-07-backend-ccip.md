# Reescritura de la capa de app al circuito CCIP — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` para ejecutar tarea por tarea. Los pasos usan checkbox (`- [ ]`).

**Goal:** Reescribir repos / services / API routes / Zod / tests de Gestión Uno para que calcen con el schema CCIP ya aplicado en Supabase, sin tocar la DB.

**Architecture:** Los tipos dejan de escribirse a mano: se derivan de `src/lib/supabase/database.types.ts` (generado). El cliente se tipa con `createClient<Database>()`, de modo que un `.insert()` con una columna que ya no existe es un **error de compilación**, no un 500 en runtime. La numeración, los derivados de LCE y las reglas duras viven en la DB: los services **pre-validan** y un único `handleRouteError` traduce el `RAISE EXCEPTION` de Postgres (`P0001`) a **422** con el mensaje en español tal cual. Las transiciones de estado son un `PATCH /<doc>/[id]/estado` homogéneo en las 4 entidades.

**Tech Stack:** Next.js 15 App Router · TypeScript 5 · `@supabase/supabase-js` (service_role, server-only) · Zod · vitest.

**Fuentes de verdad:** `docs/SCHEMA_CIRCUITO_2026-07-07.md` (contrato) · `src/lib/supabase/database.types.ts` (tipos) · `docs/DISENO_CIRCUITO_CCIP_2026-07-07.md` (por qué).

**Regla dura:** cero acceso a Supabase desde este trabajo. Si falta un trigger/columna → se para y se le pide a Juan Andrés (ver "Gaps de DB" al final).

---

## Estructura de archivos

### Se crean

| Archivo | Responsabilidad |
|---|---|
| `src/shared/http-error.ts` | Una sola clase `HttpError(status, message)`. Sin jerarquía. |
| `src/shared/handle-route-error.ts` | Traduce excepción → `NextResponse`. Zod→400, `P0001`→422, `23505`→409, resto→500. |
| `src/shared/parse-id.ts` | `parseId(raw)`: `string → number` entero positivo o `HttpError(400)`. |
| `src/shared/totales.ts` | Funciones puras de totales de línea y cabecera. |
| `src/shared/totales.test.ts` | Tests de las puras. |
| `src/shared/transiciones.ts` | Grafo de transiciones por documento + rol requerido. |
| `src/shared/transiciones.test.ts` | Tests del grafo. |
| `src/models/enums.ts` | Enums derivados de `Database['public']['Enums']` + labels en español. |
| `src/models/rollup.model.ts` | Tipos de las 4 vistas. |
| `src/repositories/caja.repository.ts` | CRUD `gu_cajas`. |
| `src/repositories/item-precio.repository.ts` | `gu_item_proveedor_precio`. |
| `src/controllers/caja.controller.ts` | `CajaService`. |
| `src/app/api/cajas/route.ts`, `src/app/api/cajas/[id]/route.ts` | CRUD admin de cajas. |
| `src/app/api/{ordenes-compra,certificaciones,facturas,ordenes-pago}/[id]/estado/route.ts` | Transiciones (4 archivos). |
| `src/app/api/facturas/[id]/imputaciones/route.ts` | Alta/baja de imputación N:M. |
| `src/app/api/ordenes-pago/[id]/{facturas,cajas}/route.ts` | Líneas de OP. |
| `src/shared/{certificacion,caja}-validation.ts` | Zod nuevos. |
| `docs/CONTRATO_CIRCUITO_2026-07-07.md` | Contrato para el agente de frontend. |

### Se reescriben

`src/models/{orden-compra,orden-pago,item}.model.ts` + `index.ts` · los 5 repos del circuito + `item.repository.ts` · los 5 services del circuito + `item.controller.ts` · las rutas de OC/CE/FACT/OP/items · `src/shared/{orden-compra,orden-pago,factura,item}-validation.ts` · `src/lib/supabase/service.ts` (una línea) · los 4 `*.test.ts` del circuito.

### Se borran

- `CertificacionService.siguienteNumero`, `FacturaService.siguienteNumero`, `OrdenPagoService.siguienteNumero` **y sus tests** — la DB genera la numeración. (~90 líneas + 3 bloques de test.)
- `CertificacionService.getLineasOCDisponibles` en su forma actual (recalcula en JS lo que hoy da `v_loc_rollup`).
- `precio_sugerido` e `item_codigo` de modelos, Zod y UI.
- `src/models/proveedor.model.ts` si queda redundante contra `Tables<'gu_proveedores'>` (verificar al ejecutar).

### Fuera de alcance (no tocar)

`lib/auth/*`, `lib/audit/*`, `app/api/admin/*`, `app/api/auth/*`, `shared/permissions*.ts` (solo se **agrega** el mapa de roles por transición), `middleware.ts`, `rate-limit.ts`.

### Blast radius en UI (20 archivos)

`views/{orden-compra-form,orden-compra-details,certificacion-form,certificacion-detail,certificaciones-list,factura-form,factura-detail,facturas-list,orden-pago-form,orden-pago-details,dashboard-overview}.tsx`, `components/items/{ItemCombobox,ItemQuickCreateDialog,ItemSelector}.tsx`, `shared/{use-orders,use-ordenes-pago,use-items,use-dashboard,use-reportes,status-colors}.ts`.

**Decisión:** este plan aplica en la UI **solo el arreglo mecánico mínimo** para que `tsc`/`build` queden verdes (renombres de campo, enums, borrar `precio_sugerido`), marcado con `// TODO(frontend):`. La UX real (wizards, selector de item, imputación, split de cajas) la rehace el agente de frontend con el contrato de la Fase 7. **No se rediseña UI acá.**

---

## Fase 1 — Fundaciones tipadas

### Task 1: Tipar el cliente Supabase

**Files:**
- Modify: `src/lib/supabase/service.ts:1,21`

- [ ] **Step 1: Importar el tipo y aplicarlo al cliente**

```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
// ... (comentario existente sin cambios)
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada.')
  }
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. Copiala del dashboard de Supabase (Settings → API) a .env.local.'
    )
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
```

- [ ] **Step 2: Verificar que rompe donde tiene que romper**

Run: `npx tsc --noEmit`
Expected: FAIL con errores en `repositories/*` — cada `.insert()` con `precio_sugerido`, `item_codigo`, `numero_oc`, etc. Anotar la lista: es el inventario exacto del trabajo de las fases 3–6. **No arreglar todavía.**

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/service.ts
git commit -m "F1: tipar el cliente Supabase con Database (los .from() ahora validan columnas)"
```

### Task 2: Modelos derivados del schema

**Files:**
- Create: `src/models/enums.ts`, `src/models/rollup.model.ts`
- Rewrite: `src/models/orden-compra.model.ts`, `src/models/orden-pago.model.ts`, `src/models/item.model.ts`, `src/models/index.ts`

- [ ] **Step 1: `src/models/enums.ts`**

```ts
import type { Database } from "@/lib/supabase/database.types"

type Enums = Database["public"]["Enums"]

export type EstadoAprobacion = Enums["estado_aprobacion"] // OC y CE
export type EstadoFactura = Enums["estado_factura"]
export type EstadoOp = Enums["estado_op"]
export type EstadoRollup = Enums["estado_rollup"]
export type CajaTipo = Enums["caja_tipo"]
export type Moneda = Enums["moneda_enum"]

// Listas para Zod (z.enum) y para la UI. Única fuente: si la DB cambia, tsc rompe acá.
export const ESTADOS_APROBACION = ["borrador", "en_aprobacion", "aprobado", "rechazado", "anulado"] as const satisfies readonly EstadoAprobacion[]
export const ESTADOS_FACTURA = ["borrador", "finalizado", "anulado"] as const satisfies readonly EstadoFactura[]
export const ESTADOS_OP = ["borrador", "en_aprobacion", "aprobado", "pagado", "rechazado", "anulado"] as const satisfies readonly EstadoOp[]
export const CAJA_TIPOS = ["banco", "efectivo", "cheque", "transferencia"] as const satisfies readonly CajaTipo[]
export const MONEDAS = ["ARS", "USD", "EUR"] as const satisfies readonly Moneda[]

// El enum de la DB dice 'en_aprobacion'; la pantalla dice "Esperando aprobación".
export const LABEL_ESTADO: Record<EstadoAprobacion | EstadoFactura | EstadoOp | EstadoRollup, string> = {
  borrador: "Borrador",
  en_aprobacion: "Esperando aprobación",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  anulado: "Anulado",
  finalizado: "Finalizado",
  pagado: "Pagado",
  sin: "Sin certificar",
  parcial: "Parcial",
  total: "Total",
}
```

- [ ] **Step 2: `src/models/orden-compra.model.ts`** (mismo patrón para `orden-pago`, `item`, y nuevos `certificacion`, `factura`, `caja`)

```ts
import type { Database } from "@/lib/supabase/database.types"

type T = Database["public"]["Tables"]

export type OrdenCompra = T["gu_ordenesdecompra"]["Row"]
export type OrdenCompraLinea = T["gu_lineasdeordenesdecompra"]["Row"]

// La app manda solo lo que la DB no genera: numero_oc/id/created_at los pone el trigger,
// y estado lo fija el server (S2). Los totales SÍ los calcula la app.
export type CreateOrdenCompraData = Omit<
  T["gu_ordenesdecompra"]["Insert"],
  "id" | "numero_oc" | "estado" | "created_at" | "updated_at"
>
export type CreateOrdenCompraLinea = Omit<
  T["gu_lineasdeordenesdecompra"]["Insert"],
  "id" | "numero_loc"
>

// Línea con el item del catálogo resuelto (join a gu_items)
export type OrdenCompraLineaConItem = OrdenCompraLinea & {
  item: Pick<T["gu_items"]["Row"], "id" | "codigo" | "nombre" | "descripcion" | "unidad_medida" | "categoria"> | null
}

// Input de la UI al agregar una línea: si no manda precio, se hereda de gu_item_proveedor_precio.
export interface CreateLineaFromItem {
  item_id: number
  cantidad: number
  precio_unitario_neto?: number
  iva_porcentaje?: number
  descripcion?: string
}
```

- [ ] **Step 3: `src/models/rollup.model.ts`**

```ts
import type { Database } from "@/lib/supabase/database.types"

type V = Database["public"]["Views"]

export type LocRollup = V["v_loc_rollup"]["Row"]
export type OcRollup = V["v_oc_rollup"]["Row"]
export type CertRollup = V["v_cert_rollup"]["Row"]
export type FacturaRollup = V["v_factura_rollup"]["Row"]
```

- [ ] **Step 4: Actualizar el barrel**

```ts
// src/models/index.ts
export * from './enums'
export * from './rollup.model'
export * from './orden-compra.model'
export * from './certificacion.model'
export * from './factura.model'
export * from './orden-pago.model'
export * from './caja.model'
export * from './item.model'
export * from './proveedor.model'
export * from './user.model'
```

- [ ] **Step 5: `npx tsc --noEmit`** — se esperan errores en views/repos. Anotarlos, no arreglarlos aún.

- [ ] **Step 6: Commit**

```bash
git add src/models
git commit -m "F1: modelos derivados de database.types (se van los tipos escritos a mano)"
```

### Task 3: `parseId` + `HttpError` + `handleRouteError`

**Files:**
- Create: `src/shared/http-error.ts`, `src/shared/parse-id.ts`, `src/shared/handle-route-error.ts`, `src/shared/parse-id.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```ts
// src/shared/parse-id.test.ts
import { describe, it, expect } from "vitest"
import { parseId } from "./parse-id"
import { HttpError } from "./http-error"

describe("parseId", () => {
  it("convierte un id válido a number", () => {
    expect(parseId("42")).toBe(42)
  })

  it.each(["0", "-1", "1.5", "abc", "", undefined, "1e3", " 1"])(
    "rechaza %s con HttpError 400",
    (raw) => {
      expect(() => parseId(raw as string | undefined)).toThrow(HttpError)
      try {
        parseId(raw as string | undefined)
      } catch (e) {
        expect((e as HttpError).status).toBe(400)
      }
    }
  )
})
```

- [ ] **Step 2: Correr y ver que falla**

Run: `npx vitest run src/shared/parse-id.test.ts`
Expected: FAIL — `Cannot find module './parse-id'`.

- [ ] **Step 3: Implementar**

```ts
// src/shared/http-error.ts
// Un solo tipo de error de aplicación. No hay jerarquía: el status ES la semántica.
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = "HttpError"
  }
}
```

```ts
// src/shared/parse-id.ts
import { HttpError } from "./http-error"

// Frontera string→number de las rutas [id]. Las PK son BIGINT: entero positivo o nada.
export function parseId(raw: string | undefined): number {
  if (!raw || !/^\d+$/.test(raw)) throw new HttpError(400, `ID inválido: ${raw ?? "(vacío)"}`)
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(400, `ID inválido: ${raw}`)
  return n
}
```

```ts
// src/shared/handle-route-error.ts
import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { HttpError } from "./http-error"

// Único traductor excepción → respuesta.
// Las reglas duras del circuito viven en triggers de Postgres: un RAISE EXCEPTION llega
// como code 'P0001' con el mensaje YA en español (ver docs/SCHEMA_CIRCUITO_2026-07-07.md)
// → se devuelve tal cual con 422. Nada de reimplementar la regla en JS.
export function handleRouteError(e: unknown, contexto: string): NextResponse {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message }, { status: e.status })
  }
  if (e instanceof ZodError) {
    return NextResponse.json({ error: "Datos inválidos", details: e.flatten() }, { status: 400 })
  }

  const pg = e as { code?: string; message?: string }
  if (pg?.code === "P0001") {
    return NextResponse.json({ error: pg.message }, { status: 422 })
  }
  if (pg?.code === "23505") {
    return NextResponse.json({ error: "El registro ya existe" }, { status: 409 })
  }
  if (pg?.code === "23503" || pg?.code === "23514") {
    // FK / CHECK: el mensaje de Postgres filtra nombres de constraint → genérico.
    console.error(`${contexto} (${pg.code}):`, pg.message)
    return NextResponse.json({ error: "Los datos violan una restricción de la base" }, { status: 422 })
  }

  console.error(`${contexto}:`, e)
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `npx vitest run src/shared/parse-id.test.ts`
Expected: PASS (8 casos).

- [ ] **Step 5: Commit**

```bash
git add src/shared/http-error.ts src/shared/parse-id.ts src/shared/handle-route-error.ts src/shared/parse-id.test.ts
git commit -m "F1: parseId + HttpError + handleRouteError (trigger P0001 -> 422)"
```

### Task 4: Totales (funciones puras)

**Files:**
- Create: `src/shared/totales.ts`, `src/shared/totales.test.ts`

- [ ] **Step 1: Test que falla**

```ts
// src/shared/totales.test.ts
import { describe, it, expect } from "vitest"
import { totalesDeLinea, totalesDeCabecera } from "./totales"

describe("totalesDeLinea", () => {
  it("calcula neto y con IVA", () => {
    expect(totalesDeLinea(10, 9500, 21)).toEqual({ total_neto: 95000, total_con_iva: 114950 })
  })

  it("IVA 0 deja neto = con IVA", () => {
    expect(totalesDeLinea(3, 100, 0)).toEqual({ total_neto: 300, total_con_iva: 300 })
  })

  it("redondea a 2 decimales (evita 0.30000000000000004)", () => {
    expect(totalesDeLinea(3, 0.1, 0).total_neto).toBe(0.3)
  })
})

describe("totalesDeCabecera", () => {
  it("suma líneas y deriva el IVA como con_iva - neto", () => {
    expect(
      totalesDeCabecera([
        { total_neto: 95000, total_con_iva: 114950 },
        { total_neto: 5000, total_con_iva: 5000 },
      ])
    ).toEqual({ total_neto: 100000, total_iva: 14950, total_con_iva: 119950 })
  })

  it("sin líneas devuelve ceros", () => {
    expect(totalesDeCabecera([])).toEqual({ total_neto: 0, total_iva: 0, total_con_iva: 0 })
  })
})
```

- [ ] **Step 2: Correr, ver fallar**

Run: `npx vitest run src/shared/totales.test.ts`
Expected: FAIL — `Cannot find module './totales'`.

- [ ] **Step 3: Implementar**

```ts
// src/shared/totales.ts
// La DB NO mantiene los totales de línea ni de cabecera (contrato 2026-07-07):
// los calcula la app. Puras a propósito → testeables sin DB.
// ponytail: number/float, no decimal.js. Con 2 decimales y montos de obra alcanza;
// si algún día hay que cerrar contra contabilidad al centavo, pasar a bigint de centavos.

const r2 = (n: number) => Math.round(n * 100) / 100

export function totalesDeLinea(cantidad: number, precioUnitario: number, ivaPorcentaje: number) {
  const total_neto = r2(cantidad * precioUnitario)
  return { total_neto, total_con_iva: r2(total_neto * (1 + ivaPorcentaje / 100)) }
}

export function totalesDeCabecera(lineas: { total_neto: number; total_con_iva: number }[]) {
  const total_neto = r2(lineas.reduce((a, l) => a + Number(l.total_neto), 0))
  const total_con_iva = r2(lineas.reduce((a, l) => a + Number(l.total_con_iva), 0))
  return { total_neto, total_iva: r2(total_con_iva - total_neto), total_con_iva }
}
```

- [ ] **Step 4: Correr, ver pasar**

Run: `npx vitest run src/shared/totales.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/totales.ts src/shared/totales.test.ts
git commit -m "F1: totales de linea y cabecera como funciones puras"
```

### Task 5: Grafo de transiciones

**Files:**
- Create: `src/shared/transiciones.ts`, `src/shared/transiciones.test.ts`
- Modify: `src/shared/permissions.ts` (agregar `ROLES_APROBACION`)

- [ ] **Step 1: Test que falla**

```ts
// src/shared/transiciones.test.ts
import { describe, it, expect } from "vitest"
import { puedeTransicionar, rolRequerido, TRANSICIONES_APROBACION, TRANSICIONES_OP } from "./transiciones"
import { ROLES_APROBACION, ROLES_ESCRITURA } from "./permissions"

describe("puedeTransicionar", () => {
  it("permite borrador -> en_aprobacion en OC/CE", () => {
    expect(puedeTransicionar(TRANSICIONES_APROBACION, "borrador", "en_aprobacion")).toBe(true)
  })

  it("prohíbe saltar borrador -> aprobado", () => {
    expect(puedeTransicionar(TRANSICIONES_APROBACION, "borrador", "aprobado")).toBe(false)
  })

  it("anulado es terminal", () => {
    expect(puedeTransicionar(TRANSICIONES_APROBACION, "anulado", "borrador")).toBe(false)
  })

  it("OP: aprobado -> pagado", () => {
    expect(puedeTransicionar(TRANSICIONES_OP, "aprobado", "pagado")).toBe(true)
  })

  it("OP: en_aprobacion -> pagado NO (hay que aprobar primero)", () => {
    expect(puedeTransicionar(TRANSICIONES_OP, "en_aprobacion", "pagado")).toBe(false)
  })
})

describe("rolRequerido", () => {
  it("aprobar/rechazar/anular/pagar exigen supervisor o admin", () => {
    for (const e of ["aprobado", "rechazado", "anulado", "pagado"]) {
      expect(rolRequerido(e)).toBe(ROLES_APROBACION)
    }
  })

  it("mandar a aprobar o finalizar alcanza con escritura", () => {
    expect(rolRequerido("en_aprobacion")).toBe(ROLES_ESCRITURA)
    expect(rolRequerido("finalizado")).toBe(ROLES_ESCRITURA)
  })
})
```

- [ ] **Step 2: Correr, ver fallar.** Run: `npx vitest run src/shared/transiciones.test.ts` → FAIL (módulo inexistente).

- [ ] **Step 3: Implementar**

```ts
// src/shared/permissions.ts  — AGREGAR (no tocar lo demás)
// Aprobar / rechazar / anular / pagar: supervisor o admin. Mismo set que ROLES_DESTRUCTIVO,
// nombrado por intención — si mañana 'usuario' puede borrar borradores pero no aprobar, se separan acá.
export const ROLES_APROBACION: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR]
```

```ts
// src/shared/transiciones.ts
import type { EstadoAprobacion, EstadoFactura, EstadoOp } from "@/models/enums"
import { ROLES_APROBACION, ROLES_ESCRITURA } from "./permissions"
import type { UserRole } from "@/models/user.model"

type Grafo<E extends string> = Record<E, readonly E[]>

// OC y CE comparten estado_aprobacion y el mismo grafo.
export const TRANSICIONES_APROBACION: Grafo<EstadoAprobacion> = {
  borrador: ["en_aprobacion", "anulado"],
  en_aprobacion: ["aprobado", "rechazado", "anulado"],
  aprobado: ["anulado"],
  rechazado: ["borrador", "anulado"],
  anulado: [],
}

export const TRANSICIONES_FACTURA: Grafo<EstadoFactura> = {
  borrador: ["finalizado", "anulado"],
  finalizado: ["anulado"],
  anulado: [],
}

export const TRANSICIONES_OP: Grafo<EstadoOp> = {
  borrador: ["en_aprobacion", "anulado"],
  en_aprobacion: ["aprobado", "rechazado", "anulado"],
  aprobado: ["pagado", "anulado"],
  pagado: [],
  rechazado: ["borrador", "anulado"],
  anulado: [],
}

export function puedeTransicionar<E extends string>(grafo: Grafo<E>, desde: E, hacia: E): boolean {
  return (grafo[desde] ?? []).includes(hacia)
}

const REQUIERE_APROBACION = new Set(["aprobado", "rechazado", "anulado", "pagado"])

export function rolRequerido(destino: string): UserRole[] {
  return REQUIERE_APROBACION.has(destino) ? ROLES_APROBACION : ROLES_ESCRITURA
}
```

- [ ] **Step 4: Correr, ver pasar.** Run: `npx vitest run src/shared/transiciones.test.ts` → PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/transiciones.ts src/shared/transiciones.test.ts src/shared/permissions.ts
git commit -m "F1: grafo de transiciones + rol requerido por destino"
```

### Task 6: Cerrar la Fase 1 en verde

- [ ] **Step 1:** `npx tsc --noEmit` — arreglar SOLO los errores de UI/hooks que dependen de los modelos nuevos, mecánicamente (`precio_sugerido` → borrar, `item_codigo` → `item.codigo`), con `// TODO(frontend): rehacer con el contrato CCIP`.
- [ ] **Step 2:** `npm run lint` → 0 errores.
- [ ] **Step 3:** `npm test` → todo verde (los tests viejos de `siguienteNumero` siguen pasando; se borran en su fase).
- [ ] **Step 4:** `npm run build` → verde.
- [ ] **Step 5:** Commit + **PARAR. Mostrar evidencia a Juan Andrés.**

---

## Fase 2 — Catálogo: items, precio×proveedor, cajas

### Task 7: `ItemRepository` + `ItemService` sobre el schema nuevo

**Files:**
- Rewrite: `src/repositories/item.repository.ts`, `src/controllers/item.controller.ts`, `src/shared/item-validation.ts`, `src/models/item.model.ts`
- Rewrite: `src/app/api/items/route.ts`, `src/app/api/items/[id]/route.ts`, `src/app/api/items/search/route.ts`, `src/app/api/items/categorias/route.ts`, `src/app/api/items/[id]/reactivate/route.ts`

Cambios de schema a absorber: `codigo` (UNIQUE, requerido) entra; `precio_sugerido` sale.

- [ ] **Step 1: Test que falla** (`src/controllers/item.controller.test.ts`, mockeando el repo)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ItemService } from "./item.controller"
import { ItemRepository } from "@/repositories/item.repository"

vi.mock("@/repositories/item.repository")

beforeEach(() => vi.resetAllMocks())

describe("ItemService.create", () => {
  it("fuerza is_active=true y no acepta precio del cliente", async () => {
    vi.mocked(ItemRepository.insert).mockResolvedValue({ id: 1 } as never)
    await ItemService.create({ codigo: "COD-0009", nombre: "Cal", precio_sugerido: 999 } as never, 7)
    expect(ItemRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: "COD-0009", nombre: "Cal", is_active: true, created_by: 7 })
    )
    expect(ItemRepository.insert).toHaveBeenCalledWith(
      expect.not.objectContaining({ precio_sugerido: expect.anything() })
    )
  })
})
```

- [ ] **Step 2:** `npx vitest run src/controllers/item.controller.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** `ItemService.create(data, createdBy)` toma solo `{codigo, nombre, descripcion?, unidad_medida?, categoria?}` (Zod ya lo recorta) y agrega `is_active: true, created_by`. El resto de métodos (`getAll`, `getById`, `search`, `getCategorias`, `update`, `deactivate`, `reactivate`) delegan al repo sin lógica.
- [ ] **Step 4:** `npx vitest run src/controllers/item.controller.test.ts` → PASS.
- [ ] **Step 5:** `CreateItemSchema` = `z.object({ codigo: z.string().min(1), nombre: z.string().min(1), descripcion: z.string().nullish(), unidad_medida: z.string().nullish(), categoria: z.string().nullish() })`. Sin `is_active`, sin `precio_sugerido` (S2/S4). En la ruta, `23505` → 409 "El registro ya existe" ya lo da `handleRouteError` (código UNIQUE).
- [ ] **Step 6:** Commit `F2: items con codigo UNIQUE, sin precio_sugerido`.

### Task 8: `ItemPrecioRepository` (precio por proveedor, alta al vuelo)

**Files:**
- Create: `src/repositories/item-precio.repository.ts`
- Create: `src/app/api/items/[id]/precio/route.ts` (GET `?proveedorId=` → `{ precio } | 404`)

- [ ] **Step 1: Implementar el repo**

```ts
// src/repositories/item-precio.repository.ts
import { createClient } from "@/lib/supabase/service"

const TABLE = "gu_item_proveedor_precio"

// Puente N:M item↔proveedor. La lista de precios se arma sola: al cargar una línea de OC
// con un precio, si el par (item, proveedor) no existe, se inserta y queda de referencia.
export class ItemPrecioRepository {
  static async findPrecio(itemId: number, proveedorId: number): Promise<number | null> {
    const supabase = createClient()
    const { data } = await supabase
      .from(TABLE)
      .select("precio")
      .eq("item_id", itemId)
      .eq("proveedor_id", proveedorId)
      .maybeSingle()
    return data ? Number(data.precio) : null
  }

  static async upsertPrecio(itemId: number, proveedorId: number, precio: number): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLE)
      .upsert({ item_id: itemId, proveedor_id: proveedorId, precio }, { onConflict: "item_id,proveedor_id" })
    if (error) throw error
  }

  static async findPreciosByProveedor(proveedorId: number) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("item_id, precio, gu_items(id, codigo, nombre, unidad_medida)")
      .eq("proveedor_id", proveedorId)
    if (error) throw error
    return data ?? []
  }
}
```

- [ ] **Step 2:** Commit `F2: repo de precio item x proveedor`.

### Task 9: Cajas (CRUD admin)

**Files:**
- Create: `src/models/caja.model.ts`, `src/repositories/caja.repository.ts`, `src/controllers/caja.controller.ts`, `src/shared/caja-validation.ts`
- Create: `src/app/api/cajas/route.ts` (GET todos los autenticados; POST admin), `src/app/api/cajas/[id]/route.ts` (PUT/DELETE admin → baja lógica `is_active=false`)

- [ ] **Step 1:** Modelo = `Tables<'gu_cajas'>`; `CreateCajaData = Omit<Insert,'id'|'created_at'|'is_active'>`.
- [ ] **Step 2:** `CreateCajaSchema = z.object({ nombre: z.string().min(1), tipo: z.enum(CAJA_TIPOS), entidad: z.string().nullish(), moneda: z.enum(MONEDAS).default("ARS") })`.
- [ ] **Step 3:** `CajaService.create` fuerza `is_active: true`. `delete` = `update({is_active:false})` (baja lógica: hay LOPcaja apuntando).
- [ ] **Step 4:** Rutas: GET `requireAuth`; POST/PUT/DELETE `requireAdmin` + `AuditService.registrarDesdeRequest({tabla:'gu_cajas', ...})`.
- [ ] **Step 5:** `npm test && npm run build` verdes. Commit `F2: CRUD de cajas (admin)`.
- [ ] **Step 6: PARAR.** Evidencia.

---

## Fase 3 — Orden de Compra

**Contrato de rutas (queda igual para las 4 entidades):**

| Método | Ruta | Rol | Devuelve |
|---|---|---|---|
| GET | `/api/ordenes-compra` | auth | `OrdenCompraListItem[]` (con rollup) |
| POST | `/api/ordenes-compra` | escritura | `201` OC en `borrador` |
| GET | `/api/ordenes-compra/[id]` | auth | OC + líneas + rollups |
| PUT | `/api/ordenes-compra/[id]` | escritura | cabecera (sin `estado`) |
| DELETE | `/api/ordenes-compra/[id]` | destructivo | `{message}` |
| **PATCH** | **`/api/ordenes-compra/[id]/estado`** | según destino | OC · `409` transición inválida · `422` gate del trigger |
| POST/PUT/DELETE | `/api/ordenes-compra/[id]/lineas[/lineaId]` | escritura | línea + cabecera recalculada |

### Task 10: `OrdenCompraRepository` tipado

**Files:** Rewrite `src/repositories/orden-compra.repository.ts`

- [ ] **Step 1:** Sacar `numero_oc` del insert, sacar `precio_sugerido`/`item_codigo`/`estado` del join de líneas. El join de item pasa a:

```ts
  static async findLineasWithItems(ordenId: number): Promise<OrdenCompraLineaConItem[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_LINEAS)
      .select("*, item:gu_items(id, codigo, nombre, descripcion, unidad_medida, categoria)")
      .eq("orden_compra_id", ordenId)
      .order("id", { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as OrdenCompraLineaConItem[]
  }
```

- [ ] **Step 2:** Agregar los métodos nuevos:

```ts
  static async updateEstado(id: number, estado: EstadoAprobacion): Promise<OrdenCompra> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).update({ estado }).eq("id", id).select().single()
    if (error) throw error   // el gate fn_oc_gate llega acá como P0001
    return data
  }

  static async findRollup(ordenId: number): Promise<OcRollup | null> {
    const supabase = createClient()
    const { data } = await supabase.from("v_oc_rollup").select("*").eq("orden_compra_id", ordenId).maybeSingle()
    return data
  }

  static async findRollupsByIds(ids: number[]): Promise<OcRollup[]> {
    if (ids.length === 0) return []
    const supabase = createClient()
    const { data, error } = await supabase.from("v_oc_rollup").select("*").in("orden_compra_id", ids)
    if (error) throw error
    return data ?? []
  }

  static async findLocRollups(ordenId: number): Promise<LocRollup[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("v_loc_rollup").select("*").eq("orden_compra_id", ordenId)
    if (error) throw error
    return data ?? []
  }
```

- [ ] **Step 3:** Borrar `findLastNumero` (la DB numera).
- [ ] **Step 4:** `npx tsc --noEmit` — el repo compila. Commit.

### Task 11: `OrdenCompraService` — líneas con item + precio al vuelo + recálculo de cabecera

**Files:** Rewrite `src/controllers/orden-compra.controller.ts` y `src/controllers/orden-compra.controller.test.ts`

- [ ] **Step 1: Tests que fallan** (reemplazan los de `siguienteNumero`)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { OrdenCompraService } from "./orden-compra.controller"
import { OrdenCompraRepository } from "@/repositories/orden-compra.repository"
import { ItemPrecioRepository } from "@/repositories/item-precio.repository"

vi.mock("@/repositories/orden-compra.repository")
vi.mock("@/repositories/item-precio.repository")
beforeEach(() => vi.resetAllMocks())

describe("OrdenCompraService.create", () => {
  it("fuerza estado borrador y no manda numero_oc (lo genera la DB)", async () => {
    vi.mocked(OrdenCompraRepository.insert).mockResolvedValue({ id: 5, numero_oc: "OC-00005" } as never)
    await OrdenCompraService.create({ proveedor_id: 1, fecha_oc: "2026-07-07", moneda: "ARS" } as never)
    const arg = vi.mocked(OrdenCompraRepository.insert).mock.calls[0][0]
    expect(arg).toMatchObject({ estado: "borrador" })
    expect(arg).not.toHaveProperty("numero_oc")
  })

  it("si fallan las líneas, borra la cabecera (compensación anti-huérfanas)", async () => {
    vi.mocked(OrdenCompraRepository.insert).mockResolvedValue({ id: 5 } as never)
    vi.mocked(OrdenCompraRepository.insertLineas).mockRejectedValue(new Error("boom"))
    await expect(
      OrdenCompraService.create({ proveedor_id: 1, fecha_oc: "2026-07-07", lineas: [{ item_id: 1, cantidad: 1 }] } as never)
    ).rejects.toThrow("boom")
    expect(OrdenCompraRepository.deleteById).toHaveBeenCalledWith(5)
  })
})

describe("OrdenCompraService.addLinea", () => {
  it("hereda el precio del proveedor cuando la UI no manda precio", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, proveedor_id: 2 } as never)
    vi.mocked(ItemPrecioRepository.findPrecio).mockResolvedValue(9200)
    vi.mocked(OrdenCompraRepository.insertLinea).mockResolvedValue({ id: 9 } as never)
    vi.mocked(OrdenCompraRepository.findLineasByOrdenId).mockResolvedValue([
      { total_neto: 92000, total_con_iva: 111320 },
    ] as never)

    await OrdenCompraService.addLinea(5, { item_id: 1, cantidad: 10 })

    expect(ItemPrecioRepository.findPrecio).toHaveBeenCalledWith(1, 2)
    expect(OrdenCompraRepository.insertLinea).toHaveBeenCalledWith(
      expect.objectContaining({ precio_unitario_neto: 9200, total_neto: 92000, total_con_iva: 111320 })
    )
  })

  it("si la UI manda precio, lo guarda en la lista de precios del proveedor", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, proveedor_id: 2 } as never)
    vi.mocked(OrdenCompraRepository.insertLinea).mockResolvedValue({ id: 9 } as never)
    vi.mocked(OrdenCompraRepository.findLineasByOrdenId).mockResolvedValue([] as never)

    await OrdenCompraService.addLinea(5, { item_id: 1, cantidad: 10, precio_unitario_neto: 9900 })

    expect(ItemPrecioRepository.upsertPrecio).toHaveBeenCalledWith(1, 2, 9900)
  })

  it("sin precio en la puente y sin precio en el body -> 422", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, proveedor_id: 2 } as never)
    vi.mocked(ItemPrecioRepository.findPrecio).mockResolvedValue(null)
    await expect(OrdenCompraService.addLinea(5, { item_id: 1, cantidad: 10 })).rejects.toMatchObject({ status: 422 })
  })

  it("recalcula los totales de la cabecera tras insertar la línea", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, proveedor_id: 2 } as never)
    vi.mocked(ItemPrecioRepository.findPrecio).mockResolvedValue(100)
    vi.mocked(OrdenCompraRepository.insertLinea).mockResolvedValue({ id: 9 } as never)
    vi.mocked(OrdenCompraRepository.findLineasByOrdenId).mockResolvedValue([
      { total_neto: 100, total_con_iva: 121 },
      { total_neto: 900, total_con_iva: 1089 },
    ] as never)

    await OrdenCompraService.addLinea(5, { item_id: 1, cantidad: 1 })

    expect(OrdenCompraRepository.update).toHaveBeenCalledWith(5, {
      total_neto: 1000, total_iva: 210, total_con_iva: 1210,
    })
  })
})

describe("OrdenCompraService.cambiarEstado", () => {
  it("rechaza una transición inválida con 409 antes de tocar la DB", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, estado: "borrador" } as never)
    await expect(OrdenCompraService.cambiarEstado(5, "aprobado")).rejects.toMatchObject({ status: 409 })
    expect(OrdenCompraRepository.updateEstado).not.toHaveBeenCalled()
  })

  it("deja pasar borrador -> en_aprobacion (el gate de ≥1 línea lo aplica el trigger)", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, estado: "borrador" } as never)
    vi.mocked(OrdenCompraRepository.updateEstado).mockResolvedValue({ id: 5, estado: "en_aprobacion" } as never)
    await OrdenCompraService.cambiarEstado(5, "en_aprobacion")
    expect(OrdenCompraRepository.updateEstado).toHaveBeenCalledWith(5, "en_aprobacion")
  })
})
```

- [ ] **Step 2:** `npx vitest run src/controllers/orden-compra.controller.test.ts` → FAIL.

- [ ] **Step 3: Implementar el service**

```ts
import { HttpError } from "@/shared/http-error"
import { totalesDeLinea, totalesDeCabecera } from "@/shared/totales"
import { puedeTransicionar, TRANSICIONES_APROBACION } from "@/shared/transiciones"
import { ItemPrecioRepository } from "@/repositories/item-precio.repository"
import { OrdenCompraRepository } from "@/repositories/orden-compra.repository"
import type { CreateLineaFromItem, EstadoAprobacion } from "@/models"

export class OrdenCompraService {
  static async create(payload: CreateOrdenCompraData & { lineas?: CreateLineaFromItem[] }) {
    const { lineas, ...oc } = payload
    // numero_oc lo genera fn_num_oc; estado lo fija el server (S2).
    const nueva = await OrdenCompraRepository.insert({ ...oc, estado: "borrador" })
    if (lineas?.length) {
      try {
        for (const l of lineas) await OrdenCompraService.addLinea(nueva.id, l, { recalcular: false })
        await OrdenCompraService.recalcularCabecera(nueva.id)
      } catch (e) {
        await OrdenCompraRepository.deleteById(nueva.id) // sin transacción de cliente: compensamos
        throw e
      }
    }
    return nueva
  }

  // Agrega una línea eligiendo un item del catálogo. El precio se hereda de
  // gu_item_proveedor_precio; si la UI manda uno, se guarda ahí (la lista se arma sola).
  static async addLinea(ocId: number, input: CreateLineaFromItem, opts = { recalcular: true }) {
    const oc = await OrdenCompraRepository.findById(ocId)
    if (!oc) throw new HttpError(404, "Orden de compra no encontrada")

    let precio = input.precio_unitario_neto
    if (precio === undefined) {
      const heredado = await ItemPrecioRepository.findPrecio(input.item_id, oc.proveedor_id)
      if (heredado === null) {
        throw new HttpError(422, "El item no tiene precio cargado para este proveedor: indicá un precio unitario")
      }
      precio = heredado
    } else {
      await ItemPrecioRepository.upsertPrecio(input.item_id, oc.proveedor_id, precio)
    }

    const iva = input.iva_porcentaje ?? 21
    const { total_neto, total_con_iva } = totalesDeLinea(input.cantidad, precio, iva)

    const linea = await OrdenCompraRepository.insertLinea({
      orden_compra_id: ocId,
      item_id: input.item_id,
      descripcion: input.descripcion ?? "",
      cantidad: input.cantidad,
      precio_unitario_neto: precio,
      iva_porcentaje: iva,
      total_neto,
      total_con_iva,
    })

    if (opts.recalcular) await OrdenCompraService.recalcularCabecera(ocId)
    return linea
  }

  // La DB no mantiene los totales de cabecera (contrato): tras tocar líneas, la app los reescribe.
  static async recalcularCabecera(ocId: number) {
    const lineas = await OrdenCompraRepository.findLineasByOrdenId(ocId)
    await OrdenCompraRepository.update(ocId, totalesDeCabecera(lineas))
  }

  // Pre-chequeo del grafo (409). Los gates de negocio (≥1 línea) son triggers → llegan como 422.
  static async cambiarEstado(id: number, destino: EstadoAprobacion) {
    const oc = await OrdenCompraRepository.findById(id)
    if (!oc) throw new HttpError(404, "Orden de compra no encontrada")
    if (!puedeTransicionar(TRANSICIONES_APROBACION, oc.estado, destino)) {
      throw new HttpError(409, `No se puede pasar de ${oc.estado} a ${destino}`)
    }
    return OrdenCompraRepository.updateEstado(id, destino)
  }
}
```

(`updateLinea` y `deleteLinea` siguen el mismo molde: recalculan la línea con `totalesDeLinea` y llaman a `recalcularCabecera`.)

- [ ] **Step 4:** `npx vitest run src/controllers/orden-compra.controller.test.ts` → PASS (7 tests).
- [ ] **Step 5:** Commit `F3: OC service (precio al vuelo, totales, transiciones)`.

### Task 12: Rutas de OC

**Files:** Rewrite las 4 rutas de OC; Create `src/app/api/ordenes-compra/[id]/estado/route.ts`

- [ ] **Step 1:** La ruta de transición, molde para las 4 entidades:

```ts
// src/app/api/ordenes-compra/[id]/estado/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { OrdenCompraService } from "@/controllers"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { requireRole } from "@/shared/permissions-server"
import { rolRequerido } from "@/shared/transiciones"
import { ESTADOS_APROBACION } from "@/models"
import { AuditService } from "@/lib/audit/audit.service"

const BodySchema = z.object({ estado: z.enum(ESTADOS_APROBACION) })

const ACCION = {
  aprobado: "aprobar", rechazado: "rechazar", anulado: "anular",
  en_aprobacion: "actualizar", borrador: "actualizar",
} as const

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id)
    const { estado } = BodySchema.parse(await request.json())

    // El rol depende del destino: mandar a aprobar = escritura; aprobar/anular = supervisor+.
    const { error: authError, user } = await requireRole(rolRequerido(estado))
    if (authError) return authError

    const oc = await OrdenCompraService.cambiarEstado(id, estado)

    await AuditService.registrar({
      usuarioId: Number(user!.id),
      tabla: "gu_ordenesdecompra",
      registroId: id,
      accion: ACCION[estado],
      detalle: `Orden de compra ${oc.numero_oc}: ${estado}`,
    })

    return NextResponse.json(oc)
  } catch (e) {
    return handleRouteError(e, "PATCH /api/ordenes-compra/[id]/estado")
  }
}
```

- [ ] **Step 2:** Las demás rutas: reemplazar `Number(id)` por `parseId`, el `catch` copiado por `handleRouteError`, y quitar `estado` del `UpdateOrdenCompraSchema` (ahora vive en `/estado`). El GET de lista hace `findAll()` + `findRollupsByIds()` y mergea `estado_certificacion` / `monto_pendiente_certificar`.
- [ ] **Step 3:** `CreateOrdenCompraSchema` nuevo:

```ts
export const CreateOrdenCompraLineaSchema = z.object({
  item_id: z.number().int().positive(),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario_neto: z.number().min(0).optional(), // ausente = heredar del proveedor
  iva_porcentaje: z.number().min(0).max(100).optional(),
  descripcion: z.string().optional(),
})

export const CreateOrdenCompraSchema = z.object({
  proveedor_id: z.number().int().positive("El proveedor es requerido"),
  proyecto_id: z.number().int().positive().nullish(),
  fecha_oc: z.string().min(1),
  moneda: z.enum(MONEDAS).optional(),
  tarea: z.string().nullish(),
  observaciones: z.string().nullish(),
  lineas: z.array(CreateOrdenCompraLineaSchema).optional(),
})
// numero_oc, estado y totales NO se aceptan del cliente: DB / server / cálculo.
```

- [ ] **Step 4:** `npm test && npx tsc --noEmit && npm run build` verdes. Commit. **PARAR.**

---

## Fase 4 — Certificación

### Task 13: Repo + service de CE

**Files:** Rewrite `src/repositories/certificacion.repository.ts`, `src/controllers/certificacion.controller.ts`, `src/controllers/certificacion.controller.test.ts`; Create `src/models/certificacion.model.ts`, `src/shared/certificacion-validation.ts`

Cambios: la CE cuelga de **una OC** (`orden_compra_id`), ya no tiene `proyecto_id`; LCE referencia `linea_oc_id` y su único input es `avance_unidades`.

- [ ] **Step 1: Tests que fallan**

```ts
describe("CertificacionService.create", () => {
  it("hereda el proveedor de la OC y fuerza estado borrador", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, proveedor_id: 2, estado: "aprobado" } as never)
    vi.mocked(CertificacionRepository.insert).mockResolvedValue({ id: 3 } as never)
    await CertificacionService.create({ orden_compra_id: 5, fecha_devengado: "2026-07-07", lineas: [] })
    expect(CertificacionRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ orden_compra_id: 5, proveedor_id: 2, estado: "borrador" })
    )
  })

  it("no deja certificar contra una OC que no está aprobada (422)", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, proveedor_id: 2, estado: "borrador" } as never)
    await expect(
      CertificacionService.create({ orden_compra_id: 5, fecha_devengado: "2026-07-07", lineas: [] })
    ).rejects.toMatchObject({ status: 422 })
  })

  it("si el trigger del 100% rechaza una línea, borra la cabecera y propaga el error", async () => {
    vi.mocked(OrdenCompraRepository.findById).mockResolvedValue({ id: 5, proveedor_id: 2, estado: "aprobado" } as never)
    vi.mocked(CertificacionRepository.insert).mockResolvedValue({ id: 3 } as never)
    const pgError = Object.assign(new Error("No se puede certificar más del 100% de la línea de OC"), { code: "P0001" })
    vi.mocked(CertificacionRepository.insertLineas).mockRejectedValue(pgError)
    await expect(
      CertificacionService.create({ orden_compra_id: 5, fecha_devengado: "2026-07-07", lineas: [{ linea_oc_id: 1, avance_unidades: 110 }] })
    ).rejects.toBe(pgError)
    expect(CertificacionRepository.deleteById).toHaveBeenCalledWith(3)
  })
})

describe("CertificacionService.getLineasDisponibles", () => {
  it("lee v_loc_rollup en vez de recalcular el avance en JS", async () => {
    vi.mocked(CertificacionRepository.findLineasDisponibles).mockResolvedValue([] as never)
    await CertificacionService.getLineasDisponibles(5)
    expect(CertificacionRepository.findLineasDisponibles).toHaveBeenCalledWith(5)
  })
})
```

- [ ] **Step 2:** correr → FAIL.
- [ ] **Step 3: Implementar.**
  - `create`: lee la OC → `422` si `estado !== 'aprobado'` (ponytail: **no hay trigger que lo garantice**, ver Gaps de DB #1) → inserta cabecera con `proveedor_id` de la OC + `estado:'borrador'` → inserta LCE con **solo** `{certificacion_id, linea_oc_id, avance_unidades}` (el resto lo deriva `fn_lce_derive`) → si falla, `deleteById` y re-throw (el `P0001` sube y la ruta lo hace 422).
  - `recalcularCabecera(certId)`: relee LCE (ya derivadas) y escribe `total_neto = Σ avance_monto`, `total_con_iva = Σ avance_monto × (1+iva/100)`.
  - `cambiarEstado`: `puedeTransicionar(TRANSICIONES_APROBACION, ...)` → `updateEstado`.
  - `getLineasDisponibles(ocId)`: **borra los 30 renglones de acumulación en JS** → un `select` a `v_loc_rollup` joineado con las líneas de la OC.
- [ ] **Step 4:** correr → PASS. 
- [ ] **Step 5:** Rutas: `GET/POST /api/certificaciones`, `GET/PUT/DELETE /api/certificaciones/[id]`, `PATCH /api/certificaciones/[id]/estado`, y **reescribir** `GET /api/certificaciones/lineas-oc-disponibles?ordenCompraId=` (antes era `?proveedorId=`, ahora la CE cuelga de una OC).
- [ ] **Step 6:** Commit `F4: certificaciones sobre CCIP (avance por unidades, rollup por vista)`. **PARAR.**

---

## Fase 5 — Factura

### Task 14: Repo + service + imputación N:M

**Files:** Rewrite `src/repositories/factura.repository.ts`, `src/controllers/factura.controller.ts`, `src/controllers/factura.controller.test.ts`, `src/shared/factura-validation.ts`; Create `src/models/factura.model.ts`, `src/app/api/facturas/[id]/imputaciones/route.ts`, `src/app/api/facturas/[id]/estado/route.ts`

- [ ] **Step 1: Tests que fallan**

```ts
describe("FacturaService.create", () => {
  it("no manda numero_factura y fuerza estado borrador", async () => {
    vi.mocked(FacturaRepository.insert).mockResolvedValue({ id: 1 } as never)
    vi.mocked(FacturaRepository.findLineasByFacturaId).mockResolvedValue([] as never)
    await FacturaService.create({ proveedor_id: 2, fecha_emision: "2026-07-07", moneda: "ARS", lineas: [] })
    const arg = vi.mocked(FacturaRepository.insert).mock.calls[0][0]
    expect(arg).toMatchObject({ estado: "borrador" })
    expect(arg).not.toHaveProperty("numero_factura")
  })

  it("total_facturado = total_con_iva de las líneas", async () => {
    vi.mocked(FacturaRepository.insert).mockResolvedValue({ id: 1 } as never)
    vi.mocked(FacturaRepository.findLineasByFacturaId).mockResolvedValue([
      { total_neto: 1000, total_con_iva: 1210 },
    ] as never)
    await FacturaService.create({
      proveedor_id: 2, fecha_emision: "2026-07-07", moneda: "ARS",
      lineas: [{ descripcion: "x", cantidad: 10, precio_unitario: 100, iva_porcentaje: 21 }],
    })
    expect(FacturaRepository.update).toHaveBeenCalledWith(1, {
      total_neto: 1000, total_iva: 210, total_con_iva: 1210, total_facturado: 1210,
    })
  })
})

describe("FacturaService.cambiarEstado", () => {
  it("no finaliza una factura sin imputaciones (422)", async () => {
    vi.mocked(FacturaRepository.findById).mockResolvedValue({ id: 1, estado: "borrador" } as never)
    vi.mocked(FacturaRepository.findImputaciones).mockResolvedValue([] as never)
    await expect(FacturaService.cambiarEstado(1, "finalizado")).rejects.toMatchObject({ status: 422 })
  })

  it("finaliza con al menos una imputación", async () => {
    vi.mocked(FacturaRepository.findById).mockResolvedValue({ id: 1, estado: "borrador" } as never)
    vi.mocked(FacturaRepository.findImputaciones).mockResolvedValue([{ certificacion_id: 3, monto_asignado: 500 }] as never)
    vi.mocked(FacturaRepository.updateEstado).mockResolvedValue({ id: 1, estado: "finalizado" } as never)
    await FacturaService.cambiarEstado(1, "finalizado")
    expect(FacturaRepository.updateEstado).toHaveBeenCalledWith(1, "finalizado")
  })
})
```

- [ ] **Step 2:** correr → FAIL.
- [ ] **Step 3: Implementar.**
  - `create`: inserta cabecera (`estado:'borrador'`, sin `numero_factura`) → inserta LFACT con `totalesDeLinea` (ojo: la columna es `precio_unitario`, no `precio_unitario_neto`) → `recalcularCabecera` (`totalesDeCabecera` + `total_facturado = total_con_iva`) → si vinieron `imputaciones`, las inserta (el trigger `fn_check_imputacion` valida cert aprobada y Σ≤total; el error sube como 422).
  - `imputar(facturaId, [{certificacion_id, monto_asignado}])` / `desimputar(facturaId, certId)` → rutas POST/DELETE en `/imputaciones`.
  - `cambiarEstado`: grafo + pre-chequeo `≥1 imputación` para `finalizado` (Gaps de DB #5: no hay trigger).
  - `getById` devuelve `{...factura, lineas, imputaciones, rollup: v_factura_rollup}`.
- [ ] **Step 4:** correr → PASS. Commit `F5: facturas con imputación N:M a certificaciones`. **PARAR.**

---

## Fase 6 — Orden de Pago

### Task 15: Repo + service + líneas de factura y de caja

**Files:** Rewrite `src/repositories/orden-pago.repository.ts`, `src/controllers/orden-pago.controller.ts`, `src/controllers/orden-pago.controller.test.ts`, `src/shared/orden-pago-validation.ts`; Create `src/app/api/ordenes-pago/[id]/{facturas,cajas,estado}/route.ts`

- [ ] **Step 1: Tests que fallan**

```ts
describe("OrdenPagoService.create", () => {
  it("estado inicial borrador (ya no 'pendiente') y sin numero_op", async () => {
    vi.mocked(OrdenPagoRepository.insert).mockResolvedValue({ id: 1 } as never)
    await OrdenPagoService.create({ proveedor_id: 2, fecha_op: "2026-07-07", moneda: "ARS" })
    const arg = vi.mocked(OrdenPagoRepository.insert).mock.calls[0][0]
    expect(arg).toMatchObject({ estado: "borrador" })
    expect(arg).not.toHaveProperty("numero_op")
  })
})

describe("OrdenPagoService.agregarFactura", () => {
  it("rechaza una factura que no está finalizada (422)", async () => {
    vi.mocked(OrdenPagoRepository.findById).mockResolvedValue({ id: 1, estado: "borrador", moneda: "ARS" } as never)
    vi.mocked(FacturaRepository.findById).mockResolvedValue({ id: 9, estado: "borrador", moneda: "ARS" } as never)
    await expect(OrdenPagoService.agregarFactura(1, 9, 100)).rejects.toMatchObject({ status: 422 })
  })

  it("recalcula total_a_pagar como Σ de las líneas de factura", async () => {
    vi.mocked(OrdenPagoRepository.findById).mockResolvedValue({ id: 1, estado: "borrador", moneda: "ARS" } as never)
    vi.mocked(FacturaRepository.findById).mockResolvedValue({ id: 9, estado: "finalizado", moneda: "ARS" } as never)
    vi.mocked(OrdenPagoRepository.findLineasFactura).mockResolvedValue([{ monto: 300000 }, { monto: 270000 }] as never)
    await OrdenPagoService.agregarFactura(1, 9, 270000)
    expect(OrdenPagoRepository.update).toHaveBeenCalledWith(1, { total_a_pagar: 570000 })
  })
})

describe("OrdenPagoService.cambiarEstado", () => {
  it("deja subir a en_aprobacion (el gate Σcajas=total lo aplica fn_op_gate)", async () => {
    vi.mocked(OrdenPagoRepository.findById).mockResolvedValue({ id: 1, estado: "borrador" } as never)
    vi.mocked(OrdenPagoRepository.updateEstado).mockResolvedValue({ id: 1, estado: "en_aprobacion" } as never)
    await OrdenPagoService.cambiarEstado(1, "en_aprobacion")
    expect(OrdenPagoRepository.updateEstado).toHaveBeenCalledWith(1, "en_aprobacion")
  })

  it("no permite pagar directo desde en_aprobacion (409)", async () => {
    vi.mocked(OrdenPagoRepository.findById).mockResolvedValue({ id: 1, estado: "en_aprobacion" } as never)
    await expect(OrdenPagoService.cambiarEstado(1, "pagado")).rejects.toMatchObject({ status: 409 })
  })
})
```

- [ ] **Step 2:** correr → FAIL.
- [ ] **Step 3: Implementar.**
  - `create`: `estado:'borrador'`, sin `numero_op`, `total_a_pagar: 0`.
  - `agregarFactura(opId, facturaId, monto)`: valida `factura.estado==='finalizado'` (Gaps #2) y `factura.moneda===op.moneda` → insert LOP → `total_a_pagar = Σ monto`.
  - `agregarCaja(opId, cajaId, monto)`: insert LOPcaja. **No** valida moneda ni Σ=total en JS — eso es `fn_op_gate` y salta al mandar a aprobar (422). Comentario `// ponytail: la regla vive en fn_op_gate; duplicarla acá sería mentira`.
  - `cambiarEstado`: grafo `TRANSICIONES_OP` (409) → `updateEstado` (422 del gate).
- [ ] **Step 4:** correr → PASS. `npm test && npm run build`. Commit `F6: OP con facturas + cajas y gate por trigger`. **PARAR.**

---

## Fase 7 — E2E, limpieza y contrato

### Task 16: E2E del circuito desde la capa de app

**Files:** Create `scratchpad/e2e-circuito.mjs` (no va al repo)

- [ ] **Step 1:** `npm run dev` en background; script que loguea (`POST /api/auth/login` admin), guarda la cookie y recorre:
  1. `POST /api/ordenes-compra` con 1 línea (item `COD-0001`, 100 u × 9500) → `201`, `numero_oc = OC-0000X`, `estado=borrador`.
  2. `PATCH .../estado {en_aprobacion}` → 200 · `PATCH .../estado {aprobado}` → 200.
  3. `PATCH` de una OC sin líneas → **422** con `La OC debe tener al menos una línea para mandarse a aprobar`.
  4. `POST /api/certificaciones` (avance 60) → 201. Un segundo intento con 110 → **422** con el mensaje del 100%.
  5. `PATCH cert/estado {en_aprobacion}` → `{aprobado}`. `GET /api/ordenes-compra/[id]` → `estado_certificacion: "parcial"`.
  6. `POST /api/facturas` con LFACT + imputación a la cert → `PATCH {finalizado}`.
  7. `POST /api/ordenes-pago` + `POST .../facturas` + 2× `POST .../cajas` (300000 + 270000) → `PATCH {en_aprobacion}` → `{aprobado}` → `{pagado}`.
  8. Cajas con montos que **no** suman el total → **422** `El total de las cajas ... debe igualar el total a pagar`.
  9. `GET /api/facturas/[id]` → `estado_pago: "total"`.

- [ ] **Step 2:** No borrar el circuito demo (`OC-00001` → `OP-00001`). El E2E **crea** documentos nuevos (`OC-00002`, …). Avisar a Juan Andrés que quedan cargados.
- [ ] **Step 3:** Pegar la salida del script como evidencia.

### Task 17: Limpieza + contrato

- [ ] **Step 1:** Barrido de `id: string`: `models/user.model.ts`, `permissions-server.ts:19` (`user.id.toString()`), hooks. Armar la lista `archivo:línea` y pasar todo a `number`.
- [ ] **Step 2:** `grep -rn "siguienteNumero\|precio_sugerido\|item_codigo\|'pendiente'" src/` → 0 resultados.
- [ ] **Step 3:** Escribir `docs/CONTRATO_CIRCUITO_2026-07-07.md`: tabla de endpoints, shapes de lista homogéneos (`{id, numero, estado, fecha, total, proveedor_nombre, rollup}`), body de cada `PATCH /estado`, códigos (`400/403/404/409/422/500`) y qué significa cada uno.
- [ ] **Step 4:** `npm run lint && npx tsc --noEmit && npm test && npm run build` → todo verde. Pegar salidas.
- [ ] **Step 5:** `superpowers:requesting-code-review` + `fullstack-dev-skills:secure-code-guardian` sobre el diff completo.
- [ ] **Step 6: PARAR.** No pushear sin OK de Juan Andrés.

---

## Gaps de DB — para Juan Andrés (yo NO toco Supabase)

Encontré cinco cosas donde el **contrato dice una regla pero no hay trigger que la garantice**. Mientras tanto pre-valido en el service y devuelvo 422, pero **es bypasseable** (a diferencia de las 4 reglas que sí son triggers). Decidí vos:

1. **CE contra OC no aprobada.** El contrato dice "CE requiere OC aprobada", pero la tabla de gates solo lista `fn_check_avance_100` sobre LCE. ¿Trigger `BEFORE INSERT` en `gu_certificaciones`?
2. **OP con factura no finalizada.** El contrato dice `factura_id` (solo `finalizado`) en LOP, pero no hay trigger. ¿`fn_lop_gate`?
3. **`gu_certificaciones.proveedor_id` es NOT NULL** en los tipos generados, así que TS no me deja mandar `NULL` para que el trigger lo rellene. Lo resuelvo leyendo `oc.proveedor_id` en el service (una query más, explícito). Confirmame que está bien.
4. **`gu_facturas.fecha_pago`** quedó como columna huérfana (el pago vive en la OP). ¿Se dropea?
5. **`total_facturado` de FACT**: asumo `= total_con_iva` (lo que hay que pagar). Si tenía otra intención, decímelo antes de la Fase 5.

---

## Self-review

- **Cobertura del contrato:** enums (T2) · regla de oro DB-vs-app (T1 tipado + T4 totales) · 4 mensajes de trigger→422 (T3 + E2E paso 3/4/8) · 4 máquinas de estado (T5, T11, T13, T14, T15) · rollups por vista (T10, T13, T14) · catálogo + precio al vuelo + cajas (T7, T8, T9) · PK number (T3 + T17) · auditoría intacta (T12) · listas homogéneas (T12 + T17).
- **Sin placeholders:** todo paso con código tiene el código. Los repos CRUD se especifican por firma porque son `.from().select()` mecánicos y el cliente tipado los verifica en compilación.
- **Consistencia de tipos:** `cambiarEstado(id, destino)` / `recalcularCabecera(id)` / `addLinea(ocId, input, opts)` se usan con esa firma en tests y rutas. `totalesDeLinea(cantidad, precio, iva)` y `totalesDeCabecera(lineas)` idem. LFACT usa `precio_unitario` (no `precio_unitario_neto`) — chequeado contra `database.types.ts`.
