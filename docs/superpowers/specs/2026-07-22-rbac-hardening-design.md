# Diseño — Hardening del módulo de seguridad (RBAC) production-ready

Fecha: 2026-07-22 · Estado: aprobado, listo para plan de implementación.

## Problema

El enforcement de permisos es sólido a nivel API (`requirePermission`, fresco por request),
pero incompleto arriba y a los costados:

1. **Páginas sin guarda**: cualquier usuario autenticado abre `/certificaciones/nueva` (u otra)
   por URL directa. El POST da 403, pero ve el form — fuga de UX/estructura.
2. **Sidebar** muestra links a módulos que el rol no puede ver.
3. **`proveedores`** todavía usa `requireRole`/`canModificarProveedor`, ignorando su clave
   `proveedores:ver/crear` de la matriz (mismo bug que tenían CE/FACT/OP).
4. **Nada impide** que una ruta futura nazca sin gate.

## Decisiones (locked)

- **Arquitectura: defensa en profundidad, sin tocar el JWT.** La API sigue siendo la fuente de
  verdad (`requirePermission`, permisos leídos de la DB por request → sin staleness: un cambio
  de matriz aplica al instante). Se agregan capas arriba (guardas de página, sidebar) y un
  test que impide regresiones. El middleware sigue siendo solo-auth (verifica firma JWT).
- **Alcance de guardas: todas las páginas del circuito** — listas/detalles exigen `ver`,
  páginas `nueva` exigen `crear`. Incluye `proveedores`.
- **GETs helper de catálogo** (`items/search|categorias|precio`) **quedan solo-auth**: son
  lecturas de baja sensibilidad que el `ItemSelector` del form de OC necesita; gatearlos
  acoplaría "crear OC" a "ver items". Los GET no mutan, así que quedan fuera del test de
  enforcement.

## Componentes

### 1. `requirePagePermission(modulo, accion)` — nuevo helper server-side
En `src/shared/permissions-server.ts`. Server Components / Server Actions.
- Resuelve el usuario (`getAuthenticatedUser`). Sin usuario → `redirect("/login")`.
- Lee `permisos` frescos (`RolRepository.findPermisosByNombre`) y aplica `tienePermiso`
  (admin short-circuit + membership). Sin permiso → `redirect(fallback)`.
- **Fallback**: falta `ver` → `/dashboard`; falta `crear`/otra → la lista del módulo
  (parámetro opcional `fallbackUrl`, default `/dashboard`).
- Devuelve `{ user }` si pasa. Es el equivalente de `requirePermission` para páginas.

### 2. Guardas en las páginas del circuito (5 módulos + proveedores)
- **Listas** (`<modulo>/page.tsx`, ya son Server Components): `await requirePagePermission(modulo, "ver")` al inicio.
- **Nueva** (`<modulo>/nueva/page.tsx`, hoy `"use client"` pero solo renderizan el form):
  convertir a **Server Component** que guarda `crear` (fallback = la lista del módulo) y
  renderiza el form (client) adentro. El form no necesita ser client a nivel page.
- **Detalles** (`<modulo>/[id]/page.tsx`): guardan `ver`. Convertir a Server Component si hace
  falta (renderizan un componente de detalle client).
- Mapeo de módulos: `certificaciones`, `facturas`, `ordenes_pago`, `ordenes_compra`, `proveedores`.

### 3. Sidebar gateado
`src/views/app-sidebar.tsx` (client): filtra `menuItems` del circuito por `puede(modulo, "ver")`
(usa el contexto de auth ya presente). Dashboard y Reportes quedan siempre (no son módulos de
matriz). La sección Admin ya está gateada por `isAdmin`.

### 4. `proveedores` a la matriz
Migrar sus rutas de `requireRole`/`canModificarProveedor` a `requirePermission("proveedores", …)`:
- GET (lista/detalle) → `"ver"`.
- POST / PUT / activar / desactivar → `"crear"`.
- DELETE → `"crear"` (la matriz de proveedores es ver/crear, sin `borrar` — mapear el hard-delete
  a crear en vez de agregar una clave nueva al catálogo/seed).

### 5. Regla dura enforced — `route-authz.test.ts`
Test vitest (`src/app/api/route-authz.test.ts` o `src/shared/`) que:
- Escanea todos los `src/app/api/**/route.ts`.
- Detecta los métodos exportados (GET/POST/PUT/PATCH/DELETE) por archivo.
- **Falla si** algún método **mutante** (POST/PUT/PATCH/DELETE) no referencia un gate:
  `requirePermission` | `requireRole` | `requireAdmin` | `createRoute` | `estadoRoute`
  (las factories llevan `autorizar` adentro).
- **Allowlist** mínima de rutas públicas/self intencionales: `auth/login`, `auth/logout`.
- Los GET quedan fuera (no mutan).
Objetivo: una ruta mutante nueva sin gate rompe el build/CI, no se descubre en producción.

### 6. Regla dura documentada
En `CLAUDE.md` (sección de Auth/permisos): "Toda ruta mutante DEBE tener gate de autorización
(preferido `requirePermission(modulo, accion)`); toda página del circuito DEBE llamar
`requirePagePermission`. Enforced por `route-authz.test.ts`."

## No-goals (ponytail — excluido a propósito)

- No se toca el JWT (nada de permisos embebidos ni middleware de permisos en el edge).
- No se gatean los GET de catálogo.
- No se agrega `proveedores:borrar` al catálogo (DELETE → crear).
- Sin DI container, sin abstracciones nuevas de autorización. Se reusa `tienePermiso`,
  `findPermisosByNombre`, `getAuthenticatedUser`, `requirePermission`.

## Verificación

Cada pieza cierra con `tsc --noEmit` + `vitest run` (incluido el test nuevo) + `next build`,
todo en verde. Commits atómicos por pieza. Sin push automático.

## Orden sugerido de implementación

1. `proveedores` a la matriz (cierra el gap de datos; mismo patrón ya probado).
2. `requirePagePermission` + guardas de todas las páginas del circuito.
3. Sidebar gateado.
4. `route-authz.test.ts` (regla dura enforced).
5. Doc de la regla dura en CLAUDE.md.
