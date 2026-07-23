# `src/` — mapa de la arquitectura

> Guía única de orientación: qué carpeta es cada cosa, qué va adentro y qué **no**.
> Si dudás dónde poner un archivo nuevo, la respuesta está acá.
> Mapa detallado archivo-por-archivo y diagnóstico: [`docs/ARQUITECTURA_SRC_MAPA.md`](../docs/ARQUITECTURA_SRC_MAPA.md).

---

## El flujo, de punta a punta

```
browser  ──fetch──►  app/api/**/route.ts  ──►  services/  ──►  repositories/  ──►  Supabase
                     (controller HTTP)        (reglas de     (única capa con
                                               negocio)        .from())
   ▲                        │
   │                        └── valida con shared/validation/ · autoriza con lib/auth · traduce errores con lib/route
   │
app/**/page.tsx  ──renderiza──►  views/  ──usa──►  components/  ──usa──►  components/ui/
(cáscara + guarda)              (pantallas)      (chrome/genéricos)     (primitivas shadcn)
```

Regla de oro: **cada capa habla solo con la de al lado**. Una `route.ts` nunca toca un repositorio;
un `*Service` nunca toca Supabase; una `view` nunca toca un service.

---

## Las carpetas

### `app/` — lo que Next.js exige · **no se toca la estructura**

Las URLs de la app: 43 `route.ts` (la API) y 25 páginas/layouts.

- **`app/api/**/route.ts` son los controladores HTTP de verdad**: parsean el request, autorizan, llaman a un service y responden. La lógica de negocio no va acá.
- **Las páginas son cáscaras de 6-25 líneas**: llaman a `requirePagePermission(...)` y renderizan una view. Si una página pasa de ~30 líneas, lo que sobra va a `views/`.
- **`(auth)` y `(dashboard)` son route groups**: los paréntesis agrupan rutas para compartir layout **sin aparecer en la URL**. `(dashboard)/facturas/page.tsx` sirve `/facturas`, no `/dashboard/facturas`. No es un error ni desorden — es la forma correcta de App Router. **No se renombran ni se sacan.**

### `middleware.ts` — el portero · **no se puede mover**

Next.js lo busca en **exactamente un lugar**: la raíz del proyecto o `src/` (nuestro caso). Uno por proyecto.
Verifica la **firma** del JWT (`jose`, HS256) en cada request. Sin token válido → 401 en `/api`, redirect en páginas.
**Solo autentica, nunca autoriza**: la decisión por permiso vive en la API y en las páginas, leída fresca por request.

### `repositories/` — la única capa que habla con la base

Un archivo por tabla/dominio. **Es el único lugar del proyecto donde puede aparecer `.from()` de Supabase.**
Solo I/O: nada de cálculos, validaciones ni reglas de estado. `base.repository.ts` provee el CRUD genérico
que 4 de los repos reutilizan; el resto tiene queries propias (joins, vistas de rollup).

### `services/` — las reglas de negocio

Clases `*Service` con métodos estáticos, un archivo por dominio (`factura.service.ts` → `FacturaService`).
Delegan **todo** el acceso a datos a su repositorio. Acá viven: numeración, cálculo de totales, compensación
anti-huérfanas, validación de transiciones, guardas anti auto-lockout.

Dos módulos funcionales (no clases) que son dominio puro y por eso viven acá:
- **`totales.ts`** — IVA y totales de línea/cabecera/certificación.
- **`transiciones.ts`** — la máquina de estados del circuito OC→CE→FACT→OP (tabla de adyacencia + `puedeTransicionar`).

`index.ts` es el barrel: importá `from "@/services"`, no por path.

### `models/` — solo tipos

Interfaces, enums y DTOs derivados de `lib/supabase/database.types.ts`. **Cero funciones, cero lógica.**
`index.ts` es el barrel (`from "@/models"`).

### `views/` — las pantallas de negocio

Un archivo por lista / formulario / detalle de cada módulo (OC, CE, FACT, OP, proveedores, items, admin).
Son componentes con dominio adentro: saben qué es una factura.
Convención: `kebab-case`, sin barrel. Se importan por path (`@/views/factura-form`).

### `components/` — chrome y genéricos

Componentes **sin dominio**: sirven igual en cualquier pantalla. Sidebar, menú de usuario, theme toggle,
botón "Crear" gateado por permiso, badge de estado, contexto de auth.

**La frontera con `views/`**: ¿el componente sabe qué es una factura o una orden de compra? → `views/`.
¿Serviría igual en otra app? → `components/`.

### `components/ui/` — las primitivas de shadcn

Los ladrillos visuales: Button, Card, Input, Dialog, Table… Nada de negocio, nada de fetch.
**Esta ruta la declara `components.json`**: es donde el CLI de shadcn escribe.
Para agregar una primitiva nueva: `npx shadcn@latest add <componente>` (no la escribas a mano).
Excepciones propias, no generadas por el CLI: `search-bar`, `search-stats`, `list-shell`, `form-root-error`, `use-mobile`.

### `hooks/` — hooks de React de negocio

Los `use-*` que hacen fetch a la API y exponen estado a las vistas (`use-orders`, `use-proveedores`,
`use-dashboard`, `use-reportes`, `use-ordenes-pago`). Client-side siempre.
El hook de shadcn (`use-mobile`) va en `components/ui/`, junto al componente que lo consume.

### `lib/` — infraestructura server-only

**Regla dura: todo lo que está acá corre en el servidor.** Nunca importar `lib/` desde un componente cliente
(la única excepción es `lib/utils.ts` y `lib/supabase/database.types.ts`, que son tipos/helpers puros).

| Subcarpeta | Qué hay |
|---|---|
| `lib/auth/` | JWT + bcrypt (`auth.service`), cookies (`auth.cookies`), rate-limit del login, y **`permissions-server.ts`**: los gates `requireAuth` / `requireAdmin` / `requireRole` / `requirePermission` / `requirePagePermission` |
| `lib/route/` | El kernel de las API routes: `handle-route-error` (traduce excepción→HTTP), `http-error`, `parse-id`, y las factories `crud-route` / `estado-route` |
| `lib/audit/` | Bitácora server-side en `gu_auditoria` (best-effort, no bloqueante) |
| `lib/supabase/` | `service.ts` = cliente `service_role` memoizado, fail-fast si falta la key · `database.types.ts` = tipos generados |
| `lib/utils.ts` | `cn()` — la ruta que `components.json` declara para el CLI de shadcn |

### `shared/` — lo genuinamente compartido entre cliente y servidor

Lo que sobrevive acá es poco y a propósito:

- **`shared/validation/`** — los 8 schemas Zod de request, uno por dominio. Todo `POST`/`PUT` de la API valida acá. Un schema nuevo va en este directorio, nunca inline en la ruta.
- **`permissions.ts` + `permissions-catalog.ts`** — la matriz RBAC (`modulo:accion`) y la decisión pura `tienePermiso`. **Isomorfos**: los usan tanto la API como los componentes cliente. (El *enforcement* con I/O es `lib/auth/permissions-server.ts` — server-only.)
- **`api-client.ts`** — el `fetch` con manejo de error del browser. Client-only.
- **`date-utils` · `format-utils` · `search-utils` · `toast-helpers`** — presentación.

> **`shared/` no es el cajón de sastre.** Si algo no es "lo usan cliente Y servidor" o "es formato puro",
> pertenece a otra carpeta. Antes de agregar algo acá, buscá su capa real.

---

## Reglas duras del proyecto

1. **`.from()` de Supabase solo en `repositories/`.** Verificable: `grep -rn "\.from(" src` no debe dar hits fuera de `repositories/` y `lib/` (auth y audit son infra, la excepción documentada).
2. **Toda ruta mutante (POST/PUT/PATCH/DELETE) lleva gate de autorización.** Enforced por `app/api/route-authz.test.ts`: escanea todas las rutas y **rompe el build** si falta uno.
3. **Toda página del circuito llama `requirePagePermission`** (`ver` en listas/detalles, `crear` en las `nueva`). Bloquea el acceso por URL directa.
4. **El estado inicial lo fija el servidor, nunca el body.** Los schemas de create omiten `estado`/`id`/`created_at`.
5. **Los estados en la DB están en español** y "pagado" existe **solo** en órdenes de pago.
6. **No se salta ninguna etapa del circuito**: OC → Certificación → Factura → Orden de Pago.

## El gate, antes de cada commit

```bash
npx tsc --noEmit && npm test && npm run build
```

`tsc` caza el 100% de los imports rotos. La suite es de **282 tests en 23 archivos** — si el número baja,
algo se rompió. Los tests van **colocados junto al código** que prueban (`x.service.ts` + `x.service.test.ts`).

## Dónde pongo un archivo nuevo

| Si es… | Va en |
|---|---|
| Una query a la base | `repositories/` |
| Una regla de negocio, un cálculo, una validación de dominio | `services/` |
| Un tipo o un enum | `models/` |
| Un endpoint | `app/api/<recurso>/route.ts` |
| Una pantalla o un formulario | `views/` |
| Un componente reusable sin dominio | `components/` |
| Una primitiva visual | `components/ui/` (vía el CLI de shadcn) |
| Un `use-algo` que hace fetch | `hooks/` |
| Un schema Zod de request | `shared/validation/` |
| Algo que toca cookies, JWT, el cliente Supabase o `next/headers` | `lib/` |
| Un formatter o helper de presentación | `shared/` |
