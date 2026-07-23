# Mapa de `src/` — qué hace cada cosa, qué está mal ubicado, y qué mover

> ## ✅ EL PLAN SE EJECUTÓ (2026-07-23)
>
> Los **8 pasos** de la §6 están aplicados, uno por commit, cada uno con `tsc --noEmit` + `vitest`
> en verde y **282/282 tests** (baseline idéntico de punta a punta). `next build` verde al cierre,
> con bundles idénticos al baseline → cero cambio de comportamiento.
>
> `53fc61c` P1 muerto · `193e314` P2 views/ui→components/ui · `37e3e24` P3 cn→lib/utils +
> components.json · `aa1454a` P4 frontera views↔components · `5a2b4ea` P5 infra HTTP→lib/ ·
> `b43425a` P6 hooks/ · `4a09ed6` P7 shared/validation + dominio · `8068c88` P8 controllers→services
>
> **El Paso 0 se hizo como un README único** (`src/README.md`), no uno por carpeta — decisión de
> Juan Andrés. **NO se agregó `server-only`** (el brief pedía cero dependencias nuevas).
> **Sin push.** Las secciones 2 a 5 de abajo describen el estado **previo** al refactor: se conservan
> como el diagnóstico que lo justificó. Para la estructura vigente, ver `src/README.md`.

> **Fase READ-ONLY (cómo se produjo este documento).** El análisis no ejecutó nada: ningún archivo fue
> movido, renombrado, editado ni borrado para producirlo. La ejecución vino después, en una fase aparte.
>
> Fecha: 2026-07-23 · Rama: `dev` · 229 archivos en `src/` · 23 archivos `*.test.ts`
> Método: 4 subagentes read-only en paralelo (app / capas de negocio y datos / frontend / shared+lib),
> con grafo de imports resuelto por script (alias `@/` + relativos + barrels), no intuición.

---

## 1. Resumen ejecutivo — qué es cada carpeta, en criollo

| Carpeta | Archivos | Qué es, en una línea |
|---|---|---|
| `src/app/` | 70 | **Lo que Next.js exige.** Las URLs de la app: 43 `route.ts` (la API) y 25 páginas/layouts. Las páginas son cáscaras de 6-25 líneas que delegan a `views/`. |
| `src/repositories/` | 13 | **Los que hablan con la base.** Única capa que ejecuta `.from()` de Supabase. Un archivo por tabla/dominio. |
| `src/controllers/` | 20 | **Las reglas de negocio.** Clases `*Service` (sí: la carpeta dice "controllers" y adentro hay "Services" — ese es el problema #1 de nombres). 10 fuente + 9 tests + barrel. |
| `src/models/` | 11 | **Los tipos.** Interfaces y enums TypeScript. Cero funciones, cero lógica. |
| `src/views/` | 27 | **Las pantallas.** Un archivo por lista/form/detalle de cada módulo (OC, CE, FACT, OP, proveedores, admin). |
| `src/views/ui/` | 27 | **Los ladrillos visuales.** Las primitivas de shadcn (Button, Card, Input…). Nada de negocio. Están en la carpeta equivocada por convención. |
| `src/components/` | 3+3 | **Sobras del scaffolding.** 3 genéricos (theme, user-menu) + 3 de items que son dominio puro. Se solapa con `views/`. |
| `src/shared/` | 44 | **El cajón.** 8 naturalezas distintas en un directorio plano: schemas Zod, plomería HTTP del server, RBAC, hooks de React, un componente `.tsx`, formatters, reglas de negocio y 11 tests. |
| `src/lib/` | 9 | **Infraestructura con secretos.** Auth (JWT+bcrypt), bitácora de auditoría, cliente Supabase `service_role`. Todo server-only, coherente. |
| `src/middleware.ts` | 1 | **El portero.** Verifica la firma del JWT en cada request. Next.js **obliga** a que esté ahí. |

**Diagnóstico en una frase:** el núcleo de 4 capas (`repositories → controllers → models → views/app`)
está sano y verificado; la confusión no viene de la arquitectura sino de **dos cajones desordenados
(`views/` con 54 archivos de dos naturalezas, `shared/` con 44 de ocho) y de tres nombres que mienten**
(`controllers/` que contiene Services, `components/` que contiene dominio, `views/ui` que contradice shadcn).

---

## 2. Mapa por carpeta

### 2.1 `src/app/api/**` — 43 rutas

"Gate" = autorización **además** del middleware (que ya exige JWT válido salvo en `/login` y `/api/auth/login`).

| Ruta HTTP | Métodos | Qué hace | Service / helper | Gate | Veredicto |
|---|---|---|---|---|---|
| `/api/admin/auditoria` | GET | Consulta bitácora + control de cambios | `AuditService.consultar` | `requireAuth` + `isAdmin` inline (:13-20) | MAL → usar `requireAdmin` |
| `/api/admin/roles` | GET, POST | Catálogo de roles / alta | `RolService`, `AuditService` | `requireAdmin` | BIEN (POST sin Zod) |
| `/api/admin/roles/[id]` | PUT, DELETE | Editar / borrar rol | `RolService`, `AuditService` | `requireAdmin` | BIEN |
| `/api/admin/users` | GET, POST | Listar / alta usuario | `UsuarioService`, `AuditService` | GET: inline (:13-25) · POST: `requireAdmin` | MAL (GET) |
| `/api/admin/users/[id]` | PUT, DELETE | Editar / baja lógica | `UsuarioService` | `requireAdmin` | BIEN |
| `/api/admin/users/[id]/role` | PATCH | Cambiar rol | `UsuarioService.updateRol` | `requireAdmin` | BIEN |
| `/api/admin/users/[id]/reset-password` | POST | Reset de clave | `UsuarioService.resetPassword` | `requireAdmin` | BIEN |
| `/api/auth/login` | POST | Login + cookie + rate-limit | `AuthService`, `rate-limit` | público (allowlist) | BIEN |
| `/api/auth/logout` | POST | Bitácora + borrar cookie | `getCurrentUser` | self-action | BIEN (sin `handleRouteError`) |
| `/api/auth/change-password` | POST | Cambio de clave propio | `AuthService.changePassword` | `requireAuth` | BIEN |
| `/api/auth/me` | GET | Usuario actual + `permisos` | `getCurrentUser`, `RolRepository` | 401 si no hay user | BIEN (salto de capa: usa el repo) |
| `/api/cajas` | GET, POST | Cajas activas / crear | `CajaService`, `createRoute` | GET: ninguna · POST: `requireAdmin` | BIEN |
| `/api/cajas/[id]` | GET, PUT, DELETE | Detalle / editar / baja | `CajaService`, `getByIdRoute` | GET: ninguna · resto: `requireAdmin` | BIEN |
| `/api/certificaciones` | GET, POST | Lista con rollup / certificar | `CertificacionService`, `createRoute` | `requirePermission(certificaciones, ver/crear)` | BIEN |
| `/api/certificaciones/[id]` | GET, PUT, DELETE | Detalle / editar / borrar | `CertificacionService`, `getByIdRoute` | `requirePermission` | BIEN |
| `/api/certificaciones/[id]/estado` | PATCH | Transición + auditoría | `estadoRoute` | `requirePermission(accionRequerida)` | BIEN |
| `/api/certificaciones/lineas-oc-disponibles` | GET | Líneas de OC con saldo | `CertificacionService` | `requirePermission(ver)` | BIEN |
| `/api/facturas` | GET, POST | Lista / crear | `FacturaService`, `createRoute` | `requirePermission` | BIEN |
| `/api/facturas/[id]` | GET, DELETE | Detalle / borrar | `FacturaService`, `getByIdRoute` | `requirePermission` | BIEN (sin PUT: asimetría) |
| `/api/facturas/[id]/estado` | PATCH | borrador→finalizado/anulado | `estadoRoute` | `requirePermission` | BIEN |
| `/api/facturas/[id]/imputaciones` | POST, DELETE | Imputar / desimputar CE | `FacturaService` | `requirePermission(crear)` | BIEN (sin consumidor UI) |
| `/api/facturas/certificaciones-aprobadas` | GET | CE aprobadas de un proveedor | `FacturaService` | `requirePermission(ver)` | BIEN (sin consumidor UI) |
| `/api/items` | GET, POST | Catálogo / alta | `ItemService`, `createRoute` | GET: ninguna · POST: `requirePermission` | BIEN |
| `/api/items/[id]` | GET, PUT, DELETE | Detalle / editar / soft-delete | `ItemService`, `getByIdRoute` | GET: ninguna · resto: `requirePermission` | BIEN (sin auditoría) |
| `/api/items/[id]/reactivate` | POST | Reactivar item | `ItemService.reactivate` | `requirePermission` | BIEN (sin consumidor UI) |
| `/api/items/[id]/precio` | GET | Precio item×proveedor | **`ItemPrecioRepository` directo** | ninguna | MAL → saltea el service |
| `/api/items/search` | GET | Búsqueda por texto | `ItemService.search` | ninguna | BIEN |
| `/api/items/categorias` | GET | Categorías únicas | `ItemService` | ninguna | Candidato a muerto |
| `/api/ordenes-compra` | GET, POST | Lista / crear OC | `OrdenCompraService`, `createRoute` | `requirePermission` | BIEN |
| `/api/ordenes-compra/[id]` | GET, PUT, DELETE | Detalle / editar / borrar | `OrdenCompraService`, `getByIdRoute` | `requirePermission` | BIEN |
| `/api/ordenes-compra/[id]/estado` | PATCH | Transición | `estadoRoute` | `requirePermission` | BIEN |
| `/api/ordenes-compra/[id]/lineas` | GET, POST | Líneas + avance / agregar | `OrdenCompraService` ×2 + merge | `requirePermission` | MAL (GET) → arma view-model en la ruta (:26-34) |
| `/api/ordenes-compra/lineas/[lineaId]` | PUT, DELETE | Editar / borrar línea | `OrdenCompraService`, **Zod inline** | `requirePermission` | MAL (leve) → schema fuera de `shared/` |
| `/api/ordenes-pago` | GET, POST | Lista / crear OP | `OrdenPagoService`, `createRoute` | `requirePermission` | BIEN |
| `/api/ordenes-pago/[id]` | GET, DELETE | Detalle / borrar | `OrdenPagoService`, `getByIdRoute` | `requirePermission` | BIEN |
| `/api/ordenes-pago/[id]/estado` | PATCH | …→pagado | `estadoRoute` | `requirePermission` | BIEN |
| `/api/ordenes-pago/[id]/facturas` | POST, DELETE | Agregar / quitar factura | `OrdenPagoService` | `requirePermission` | BIEN |
| `/api/ordenes-pago/[id]/cajas` | POST, DELETE | Repartir / quitar caja | `OrdenPagoService` | `requirePermission` | BIEN |
| `/api/proveedores` | GET, POST | Lista / alta | `ProveedorService`, `createRoute` | `requirePermission` | BIEN |
| `/api/proveedores/[id]` | GET, PUT, DELETE | Detalle / editar / borrar | `ProveedorService`, `getByIdRoute` | `requirePermission` | BIEN (sin auditoría en PUT/DELETE) |
| `/api/proveedores/[id]/activar` | PATCH | estado → activo | `ProveedorService.update` | `requirePermission` | DUPLICADO parcial de `/suspender` |
| `/api/proveedores/[id]/suspender` | PATCH | estado → inactivo | `ProveedorService.update` | `requirePermission` | DUPLICADO → un `PATCH /estado` alcanzaría |
| `/api/proyectos` | GET, POST | Lista / crear proyecto | `ProyectoService`, `createRoute` | GET: **ninguna** · POST: `requireRole` | Candidato a muerto (0 consumidores) |

### 2.2 `src/app/**` — 25 páginas y layouts

| Archivo | URL real | Server/Client | View que renderiza | `requirePagePermission` | Veredicto |
|---|---|---|---|---|---|
| `layout.tsx` | raíz | Server | ThemeProvider + Toaster | n/a | BIEN |
| `page.tsx` | `/` | Server | redirect a `/login` | n/a | BIEN |
| `(auth)/layout.tsx` | shell login | Server | card centrada | n/a | BIEN |
| `(auth)/login/page.tsx` | `/login` | Server | `login-form` | pública | BIEN |
| `(dashboard)/layout.tsx` | shell dashboard | Server | `app-sidebar` + `UserMenu` + `AuthProvider` | no | BIEN (`userName="Admin"` hardcodeado, :21) |
| `(dashboard)/dashboard/page.tsx` | `/dashboard` | Server | `dashboard-overview` | no aplica | BIEN |
| `(dashboard)/ordenes-compra/page.tsx` | `/ordenes-compra` | Server | `orden-compra-list` | Sí (`ver`) | BIEN |
| `(dashboard)/ordenes-compra/nueva/page.tsx` | `/ordenes-compra/nueva` | Server | `orden-compra-form` | Sí (`crear`) | BIEN |
| `(dashboard)/ordenes-compra/[id]/page.tsx` | `/ordenes-compra/:id` | Server | `orden-compra-details` | Sí (`ver`) | BIEN |
| `(dashboard)/certificaciones/page.tsx` | `/certificaciones` | Server | `certificaciones-list` | Sí (`ver`) | BIEN |
| `(dashboard)/certificaciones/nueva/page.tsx` | `/certificaciones/nueva` | Server | `certificacion-form` | Sí (`crear`) | BIEN |
| `(dashboard)/certificaciones/[id]/page.tsx` | `/certificaciones/:id` | Server | `certificacion-detail` | Sí (`ver`) | BIEN |
| `(dashboard)/facturas/page.tsx` | `/facturas` | Server | `facturas-list` | Sí (`ver`) | BIEN |
| `(dashboard)/facturas/nueva/page.tsx` | `/facturas/nueva` | Server | `factura-form` | Sí (`crear`) | BIEN |
| `(dashboard)/facturas/[id]/page.tsx` | `/facturas/:id` | Server | `factura-detail` | Sí (`ver`) | BIEN |
| `(dashboard)/ordenes-pago/page.tsx` | `/ordenes-pago` | Server | `orden-pago-list` | Sí (`ver`) | BIEN |
| `(dashboard)/ordenes-pago/nueva/page.tsx` | `/ordenes-pago/nueva` | Server | `orden-pago-form` | Sí (`crear`) | BIEN |
| `(dashboard)/ordenes-pago/[id]/page.tsx` | `/ordenes-pago/:id` | Server | `orden-pago-details` | Sí (`ver`) | BIEN |
| `(dashboard)/proveedores/page.tsx` | `/proveedores` | Server | `proveedor-list` | Sí (`ver`) | BIEN |
| `(dashboard)/proveedores/nuevo/page.tsx` | `/proveedores/nuevo` | Server | `proveedor-form` | Sí (`crear`) | BIEN |
| `(dashboard)/proveedores/[id]/page.tsx` | `/proveedores/:id` | Server | `proveedor-detail-client` | Sí (`ver`) | BIEN |
| `(dashboard)/proveedores/[id]/editar/page.tsx` | `/proveedores/:id/editar` | **Client** | `proveedor-form` | **NO** | MAL → única página del circuito sin guarda |
| `(dashboard)/reportes/page.tsx` | `/reportes` | **Client** | `reportes-dashboard` | no aplica | MAL (leve) → el hook debería vivir en la view |
| `(dashboard)/admin/layout.tsx` | shell `/admin/*` | **Client** | guard `isAdmin` en `useEffect` | imposible (es client) | MAL → sin guarda server-side |
| `(dashboard)/admin/usuarios/page.tsx` | `/admin/usuarios` | **Client** | `admin-usuarios-tab` + `admin-roles-tab` | no | BIEN como shell (duplica el guard, :26-34) |
| `(dashboard)/admin/auditoria/page.tsx` | `/admin/auditoria` | **Client** | **ninguna — 231 líneas inline** | no | MAL → extraer a `views/` |

**Los route groups `(auth)` y `(dashboard)`, en criollo.** Los paréntesis son *route groups* de Next.js:
agrupan archivos para darles un layout común **sin aportar nada a la URL**. `(auth)/login/page.tsx`
sirve `/login` (no `/auth/login`) y hereda `(auth)/layout.tsx`, que es solo una tarjeta centrada —
el chrome mínimo de un login. `(dashboard)/facturas/page.tsx` sirve `/facturas` (no `/dashboard/facturas`)
y hereda `(dashboard)/layout.tsx`, que monta el `AuthProvider`, el sidebar, el theme toggle y el user menu.
Así las dos zonas de la app tienen shells distintos sin ensuciar las URLs.

**Confirmado con evidencia: la estructura es la correcta.** `src/views/app-sidebar.tsx:26-31` linkea a
`/ordenes-compra`, `/certificaciones`, `/facturas`… sin prefijo `dashboard`; y el redirect post-login
va a `/dashboard` (`src/middleware.ts:50`), que existe como `(dashboard)/dashboard/page.tsx` — o sea,
el segmento `dashboard` de la URL viene de la **carpeta** `dashboard/`, no del grupo. Único detalle
cosmético: que el grupo se llame igual que una de sus carpetas confunde al leer, pero es legal.
**No se toca.**

### 2.3 `src/controllers/` (20)

| Ruta | Qué hace | Quién lo importa | Capa | Veredicto |
|---|---|---|---|---|
| `index.ts` | Barrel: re-exporta **9 de 10** services (falta `factura`) | 21 route files | negocio | BIEN, con defecto (H1) |
| `caja.controller.ts` | `CajaService`: CRUD cajas + baja/reactivar | barrel, su test | negocio | BIEN |
| `certificacion.controller.ts` | `CertificacionService`: CE, líneas, recálculo, estado, líneas OC disponibles | 4 rutas, barrel, test | negocio | BIEN |
| `factura.controller.ts` | `FacturaService`: FACT, imputar/desimputar N:M, estado | 5 rutas, test | negocio | BIEN — **fuera del barrel** |
| `item.controller.ts` | `ItemService`: catálogo, búsqueda, `isInUse` | barrel, `orden-compra.controller:16` | negocio | BIEN |
| `orden-compra.controller.ts` | `OrdenCompraService`: OC + líneas + totales/IVA + rollups | barrel, test | negocio | BIEN |
| `orden-pago.controller.ts` | `OrdenPagoService`: OP, líneas factura/caja, estado→pagado | barrel, test | negocio | BIEN |
| `proveedor.controller.ts` | `ProveedorService`: CRUD + default de estado (S2) | barrel, test | negocio | BIEN |
| `proyecto.controller.ts` | `ProyectoService`: 5 métodos pass-through, **cero reglas** | ruta proyectos, barrel | negocio | CAPA VACÍA (H5) |
| `rol.controller.ts` | `RolService`: CRUD roles + guardas de sistema | 2 rutas admin, test | negocio | BIEN |
| `usuario.controller.ts` | `UsuarioService`: alta/baja/reset + anti auto-lockout | 4 rutas admin, test | negocio | BIEN |
| `*.controller.test.ts` (9) | Unit tests mockeando el repo | vitest | test | BIEN (colocados) |

### 2.4 `src/repositories/` (13)

| Ruta | Qué hace | Quién lo importa | Veredicto |
|---|---|---|---|
| `base.repository.ts` | `createBaseRepository<Row,Insert,Update>`: CRUD genérico | 4 repos + test | BIEN |
| `caja.repository.ts` | `gu_cajas`: base + `findAllActive`/`setActive` | `CajaService` | BIEN |
| `certificacion.repository.ts` | `gu_certificaciones` + líneas + vistas rollup | `CertificacionService` | BIEN (`findLineasDisponibles: Promise<any[]>` :87) |
| `factura.repository.ts` | `gu_facturas` + líneas + puente N:M + rollup | `FacturaService` | BIEN |
| `item.repository.ts` | `gu_items`: base parcial + `search`/`existsInLineasOC` | `ItemService` | BIEN |
| `item-precio.repository.ts` | `gu_item_proveedor_precio` | `OrdenCompraService` + **una ruta** | BIEN (el importador de `app/` viola capa) |
| `orden-compra.repository.ts` | `gu_ordenesdecompra` + líneas + rollups | 2 services | BIEN |
| `orden-pago.repository.ts` | `gu_ordenesdepago` + líneas factura/caja | `OrdenPagoService` | BIEN |
| `proveedor.repository.ts` | `gu_proveedores`: base puro (12 líneas) | `ProveedorService` | BIEN |
| `proyecto.repository.ts` | `gu_proyectos`: base puro (10 líneas) | `ProyectoService` | BIEN |
| `rol.repository.ts` | `gu_roles` + lecturas cruzadas + `findPermisosByNombre` | `RolService`, `UsuarioService`, **`permissions-server`**, **`auth/me`** | BIEN (2 importadores fuera de capa) |
| `usuario.repository.ts` | `gu_usuario` con `SELECT_SIN_HASH` | `UsuarioService` | BIEN |
| `base.repository.test.ts` | 12 tests, cliente Supabase falso | vitest | BIEN |

### 2.5 `src/models/` (11)

| Ruta | Qué hace | Importadores | Veredicto |
|---|---|---|---|
| `index.ts` | Barrel de los 10 modelos | **37 archivos** | BIEN |
| `enums.ts` | Estados, Moneda, arrays `ESTADOS_*` y **`LABEL_ESTADO`** | barrel + 7 directos | BIEN, con reserva (H6: `LABEL_ESTADO` es presentación) |
| `rollup.model.ts` | Tipos de las 4 vistas de rollup | barrel | BIEN |
| `orden-compra.model.ts` | Row/Insert/DTO de OC y líneas | barrel + repo | BIEN |
| `certificacion.model.ts` | Row + `CreateCertificacionLinea` + `LineaOCDisponible` | barrel | BIEN |
| `factura.model.ts` | Row, imputación, DTOs | barrel | BIEN (`FacturaImputacion` sin uso) |
| `orden-pago.model.ts` | Row + líneas + DTOs | barrel | BIEN |
| `caja.model.ts` | Row + DTOs | barrel | BIEN |
| `item.model.ts` | Row + DTOs + enums de catálogo | barrel | BIEN |
| `proveedor.model.ts` | `EstadoProveedor` + Row | barrel | BIEN |
| `user.model.ts` | `UserRole` + `AuthUser` (el de la UI) | barrel + `transiciones` | BIEN |

**Verificación de capas (la parte importante).** Grep de `\.from\(` sobre **todo** `src/`:

```
src/lib/audit/audit.service.ts:44,86,112   → gu_auditoria / gu_audit_log
src/lib/auth/auth.service.ts:51,132,174,195 → gu_usuario
```

**Cero `.from()` en `app/`, `views/`, `components/`, `shared/`, `controllers/` y `models/`.** Cero imports
del cliente Supabase en los services. Cero reglas de negocio dentro de repos (los rollups se *leen* de
vistas, no se calculan). `models/` sin una sola función. **La arquitectura de 4 capas es real, no aspiracional.**
Las 7 excepciones están todas en `lib/` (infraestructura de auth y auditoría) — documentado, pero ver H4.

### 2.6 `src/views/*` — 27 vistas de dominio

| Ruta | Qué hace | Importadores | Módulo | Veredicto |
|---|---|---|---|---|
| `orden-compra-list.tsx` | Lista + buscador de OC | page OC | OC | BIEN |
| `orden-compra-form.tsx` | Alta de OC (RHF+Zod, ItemSelector) — **480 líneas** | page nueva | OC | BIEN (candidato a partir, no a mover) |
| `orden-compra-details.tsx` | Detalle + líneas + acciones | page `[id]` | OC | BIEN |
| `certificaciones-list.tsx` | Lista de CE | page CE | CE | BIEN |
| `certificacion-form.tsx` | Alta de CE contra líneas de OC | page nueva | CE | BIEN |
| `certificacion-detail.tsx` | Detalle + aprobar/rechazar/anular | page `[id]` | CE | BIEN |
| `facturas-list.tsx` | Lista de facturas | page FACT | FACT | BIEN |
| `factura-form.tsx` | Alta + imputación a certs | page nueva | FACT | BIEN |
| `factura-detail.tsx` | Detalle + certs imputadas | page `[id]` | FACT | BIEN |
| `orden-pago-list.tsx` | Lista de OP | page OP | OP | BIEN |
| `orden-pago-form.tsx` | Alta de OP (facturas + cajas) | page nueva | OP | BIEN |
| `orden-pago-details.tsx` | Detalle + pagar | page `[id]` | OP | BIEN |
| `proveedor-list.tsx` | Lista de proveedores | page | proveedores | BIEN |
| `proveedor-form.tsx` | Alta/edición | 2 pages | proveedores | BIEN |
| `proveedor-details.tsx` | Presentacional del detalle (props) | `proveedor-detail-client` | proveedores | BIEN — no es duplicado |
| `proveedor-detail-client.tsx` | Cáscara client (fetch + acciones) | page `[id]` | proveedores | BIEN (nombre confuso) |
| `admin-usuarios-tab.tsx` | Tab usuarios (CRUD, reset clave) | page admin | admin | BIEN |
| `admin-roles-tab.tsx` | Tab roles (CRUD catálogo) | page admin | admin | BIEN |
| `admin-users-shared.ts` | Tipos + mapas de label/icono | page + 2 tabs | admin | **MAL** → no es una view (es el único `.ts` sin JSX acá) |
| `rol-permisos-matrix.tsx` | Matriz de checkboxes `modulo:accion` | `admin-roles-tab` | admin | BIEN |
| `dashboard-overview.tsx` | Tarjetas del home | page dashboard | transversal | BIEN |
| `reportes-dashboard.tsx` | Indicadores desde OC + proveedores | page reportes | reportes | BIEN |
| `login-form.tsx` | Form de login | page login | transversal | BIEN |
| `app-sidebar.tsx` | Navegación lateral (oculta módulos sin `ver`) | `(dashboard)/layout` | transversal | **MAL → `components/`** (chrome de layout) |
| `crear-button.tsx` | Botón "Nueva X" gateado por `puede()` | 5 pages | transversal | **MAL → `components/`** (genérico) |
| `list-shell.tsx` | Estados loading/error de las listas | 5 listas | transversal | **MAL → `components/ui/`** (primitiva) |
| `form-root-error.tsx` | Muestra `form.setError("root")` | 4 forms | transversal | **MAL → `components/ui/`** (infra de RHF) |

**Cero candidatos a muerto**: los 27 tienen importador real.

### 2.7 `src/views/ui/*` — 27 primitivas

| Archivo | Importadores | | Archivo | Importadores |
|---|---|---|---|---|
| `button.tsx` | 33 | | `alert.tsx` | 2 |
| `card.tsx` | 26 | | `sidebar.tsx` (765 L) | 2 |
| `input.tsx` | 13 | | `tabs.tsx` | 2 |
| `label.tsx` | 11 | | `checkbox.tsx` | 1 |
| `badge.tsx` | 10 | | `command.tsx` | 1 |
| `select.tsx` | 7 | | `dropdown-menu.tsx` | 1 |
| `dialog.tsx` | 5 | | `popover.tsx` | 1 |
| `form.tsx` | 5 | | `separator.tsx` | 1 (solo sidebar) |
| `search-bar.tsx` ⚠ propio | 5 | | `sheet.tsx` | 1 (solo sidebar) |
| `search-stats.tsx` ⚠ propio | 5 | | `skeleton.tsx` | 1 (solo sidebar) |
| `textarea.tsx` | 4 | | `tooltip.tsx` | 1 (solo sidebar) |
| `alert-dialog.tsx` | 2 | | `sonner.tsx` | 1 |
| | | | `table.tsx` | 1 |
| **`switch.tsx`** | **0 → MUERTO** | | **`toggle.tsx`** | **0 → MUERTO** |

Verificado: `grep -rn "views/ui/switch\|views/ui/toggle" src` → **0 resultados**.

### 2.8 `src/components/**` (6)

| Ruta | Qué hace | Importadores | Veredicto |
|---|---|---|---|
| `theme-provider.tsx` | Wrapper de `next-themes` | `app/layout` | BIEN |
| `theme-toggle.tsx` | Botón claro/oscuro | `(dashboard)/layout` | BIEN |
| `user-menu.tsx` | Menú + dialog de cambio de clave | `(dashboard)/layout` | BIEN |
| `items/index.ts` | Barrel de los 3 de items | `orden-compra-form` | BIEN |
| `items/ItemSelector.tsx` | Combobox + alta rápida | barrel | **MAL → `views/`** (dominio items) |
| `items/ItemCombobox.tsx` | Búsqueda del catálogo | barrel, ItemSelector | **MAL → `views/`** |
| `items/ItemQuickCreateDialog.tsx` | Alta de item al vuelo | barrel, ItemSelector | **MAL → `views/`** |

### 2.9 `src/shared/**` (44) — agrupados por naturaleza real

| Grupo | Archivos | Corre en | Importadores (total) |
|---|---|---|---|
| **A. Validación Zod** (8) | `caja-`, `certificacion-`, `factura-`, `item-`, `orden-compra-`, `orden-pago-`, `proveedor-`, `proyecto-validation.ts` | server (salvo `item-` que también client) | ~30 |
| **B. Infra HTTP server** (5) | `handle-route-error.ts` (37), `parse-id.ts` (22), `crud-route.ts` (15), `http-error.ts` (14), `estado-route.ts` (4) | **server-only** | **92** |
| **C. Cliente HTTP browser** (1) | `api-client.ts` | **client-only** | 6 |
| **D. RBAC** (3) | `permissions-server.ts` (52, **server-only**), `permissions.ts` (13, isomorfo), `permissions-catalog.ts` (isomorfo) | mixto | 68 |
| **E. Hooks React** (6) | `use-orders`, `use-ordenes-pago`, `use-proveedores`, `use-dashboard`, `use-reportes`, `use-mobile` | client | 6 |
| **F. Componentes / UI** (3) | `auth-context.tsx` (13), `status-badge.tsx` (11), `status-colors.ts` (1, solo status-badge) | client | 25 |
| **G. Utils presentación** (5) | `utils.ts`=`cn` (25), `toast-helpers.ts` (18), `format-utils.ts` (14), `date-utils.ts` (5), `search-utils.ts` (5) | client | 67 |
| **H. Dominio puro** (2) | `totales.ts` (3), `transiciones.ts` (8) | server | 11 |
| **I. Tests** (11) | los 10 colocados + **`route-authz.test.ts`** (que testea `src/app/api/**`, no `shared/`) | — | — |

### 2.10 `src/lib/**` (9) y `src/middleware.ts`

| Ruta | Qué hace | Importadores | Veredicto |
|---|---|---|---|
| `lib/auth/auth.service.ts` | login/verifyToken/changePassword, bcrypt+JWT, `getJwtSecret()` lazy | 4 | BIEN (sin tests) |
| `lib/auth/auth.cookies.ts` | cookies sobre `next/headers` + `getCurrentUser` | 7 | BIEN (sin tests) |
| `lib/auth/rate-limit.ts` | 5 intentos/15min por IP+email | 2 | BIEN |
| `lib/auth/rate-limit.test.ts` | tests | — | BIEN |
| `lib/auth/index.ts` | barrel | **0** | **CANDIDATO A MUERTO** |
| `lib/audit/audit.service.ts` | bitácora `gu_auditoria` + consulta combinada | 23 | BIEN (sin tests) |
| `lib/supabase/service.ts` | Singleton `service_role`, fail-fast | 14 | BIEN |
| `lib/supabase/service.test.ts` | 3 tests | — | BIEN |
| `lib/supabase/database.types.ts` | tipos generados (1168 L) | 23 | BIEN |

**`src/middleware.ts` — no se puede mover.** Next.js lo busca en **exactamente un lugar**: la raíz del
proyecto, **o** `src/` si el proyecto usa ese directorio (que es el caso). Nunca dentro de `src/app/`,
nunca en subcarpetas, uno solo por proyecto. Hace: `verificarToken()` con `jose` HS256 leyendo
`JWT_SECRET` **por request** (a nivel de módulo rompía el "Collecting page data" de `next build`),
fail-closed si falta; rutas públicas `['/login', '/api/auth/login']`; sin token → 401 JSON en `/api`
o redirect+limpieza de cookie en páginas; con token en `/login` → redirect a `/dashboard`. Matcher:
todo salvo `_next/static`, `_next/image`, favicon e imágenes. **Solo autentica, nunca autoriza** — por diseño.

---

## 3. Diagnóstico — smells con evidencia, por impacto

### D1 · `shared/` no es una capa, es un cajón — y la mezcla cruza la frontera cliente/servidor
44 archivos, 8 naturalezas, directorio plano. Lo grave no es lo estético:
`shared/permissions-server.ts` es **server-only** (importa `lib/auth/auth.cookies` → `next/headers`),
tiene **52 importadores**, y vive **al lado alfabético** de `shared/permissions.ts`, que es isomorfo y lo
importan 8 componentes cliente. Nombres casi idénticos, un autocompletado de distancia.
Lo mismo con `crud-route.ts`/`estado-route.ts`, que importan `lib/audit` → `lib/supabase/service`
(`service_role`), viviendo junto a `use-orders.ts`.
**Verificado: `grep -rn "server-only" src` → 0 ocurrencias.** No hay red de seguridad en build.
Hoy no hay fuga real (cierre transitivo desde los 30 archivos `"use client"`: 67 módulos alcanzables,
ninguno toca `next/headers` ni el cliente `service_role`), pero la protección es la disciplina, no el compilador.

### D2 · `views/` mezcla 27 pantallas de negocio con 27 primitivas shadcn
Un `ls src/views` devuelve 54 entradas de dos naturalezas incompatibles. Es la causa literal del
"miro `src/` y no entiendo qué hace cada cosa": la carpeta con nombre más obvio es la más ruidosa.

### D3 · `components.json` describe una estructura que no existe → el CLI de shadcn está roto
```json
"ui": "@/components/ui"      → src/components/ui/ NO EXISTE (las primitivas están en src/views/ui/)
"utils": "@/lib/utils"       → src/lib/utils.ts NO EXISTE (cn vive en src/shared/utils.ts)
"hooks": "@/hooks"           → src/hooks/ NO EXISTE (los hooks están en src/shared/use-*.ts)
```
Un `npx shadcn@latest add tooltip` hoy crearía `src/components/ui/` — una **segunda** carpeta de
primitivas en paralelo — y escribiría `import { cn } from "@/lib/utils"`, que no resuelve → build rojo.
Es un smell **latente y destructivo**: nadie lo notó porque nadie corrió el CLI desde que se movió la carpeta.

### D4 · Cuatro carpetas para el frontend, sin regla deducible
`views/` + `views/ui/` + `components/` + `shared/` (que aloja `status-badge.tsx` con 11 importadores y
`auth-context.tsx` con 13). La regla declarada en `CLAUDE.md` ("views = dominio, components = genéricos")
**está invertida en 7 archivos**: `components/items/*` (3) es dominio puro, y
`views/{crear-button, list-shell, form-root-error, app-sidebar}` (4) son genéricos.
Evidencia más nítida: `app/(dashboard)/layout.tsx` importa `AppSidebar` de `@/views/` y
`UserMenu`+`ThemeToggle` de `@/components/` — en líneas contiguas, para tres cosas idénticas.
La regla *real* que sigue el código no es responsabilidad, es formato: `components/` = PascalCase + barrel
(scaffolding original de v0), `views/` = kebab-case sin barrel (todo lo agregado después).

### D5 · `controllers/` contiene `*Service`, y en Next.js los controllers de verdad son los `route.ts`
Tres nombres para una cosa: carpeta `controllers`, archivo `.controller.ts`, clase `XService`.
Peor: en App Router el controlador HTTP real (parsea request, autoriza, responde) es el `route.ts`.
Un lector nuevo busca la lógica de negocio en el lugar equivocado. Es la fuente de confusión #1 reportada.

### D6 · Reglas de negocio escondidas como "utils compartidos"
`shared/totales.ts` (IVA, totales de línea/cabecera/certificación) y `shared/transiciones.ts` (la máquina
de estados del circuito OC→CE→FACT→OP) son **las dos reglas de dominio más importantes que viven en
TypeScript**, y están en el mismo directorio que `formatCurrency` y `cn()`. Cero importadores cliente.

### D7 · Tres saltos de capa
- `app/api/items/[id]/precio/route.ts:2` → `ItemPrecioRepository` directo (única ruta sin service).
- `app/api/auth/me/route.ts:3` → `RolRepository`.
- `shared/permissions-server.ts:6` → `RolRepository.findPermisosByNombre`.

Los dos de RBAC son defendibles (el gate es infraestructura, no dominio, y meter un service agrega
latencia sin comprar nada). El de `items/[id]/precio` no: `ItemService` existe al lado.

### D8 · `lib/auth/auth.service.ts` toca `gu_usuario` con `.from()` crudo — la misma tabla que su repo
4 accesos (`:51, :132, :174, :195`) fuera de la capa de datos, duplicando el dominio de
`usuario.repository.ts`, que además tiene la protección `SELECT_SIN_HASH`. Único lugar de la app donde
dos capas leen la misma tabla con distinto criterio de columnas.

### D9 · Huecos de autorización — ✅ **RESUELTOS (2026-07-23), salvo el último**

Se cerraron en una fase aparte del refactor de ubicación, con TDD (test fallando primero) —
justamente porque son **cambio de comportamiento** y mezclarlos habría arruinado la propiedad
"este diff solo movió archivos". Suite 282 → 354.

| Hueco | Estado |
|---|---|
| `GET /api/proyectos` sin ningún gate (`proyectos/route.ts:9-16`); POST con `requireRole`, único create fuera de `requirePermission` | ✅ `proyectos` agregado al catálogo (ver/crear → 22 claves); GET y POST con `requirePermission`. ⚠️ Los roles de sistema no tienen `proyectos:*` en `gu_roles.permisos` — hoy solo admin. No rompe nada (0 consumidores), pero hay que darlos cuando se conecte el módulo |
| `proveedores/[id]/editar` sin `requirePagePermission` | ✅ Server Component + `requirePagePermission("proveedores","crear","/proveedores")`; el client se extrajo a `views/proveedor-editar-client.tsx` |
| `admin/layout.tsx` `"use client"` con guard en `useEffect` | ✅ Server Component + **`requirePageAdmin()`** (nuevo). Se borró además el guard duplicado e inalcanzable de `admin/usuarios/page.tsx` |
| `admin/auditoria` y `admin/users` GET gateando a mano (D9-5) | ✅ Ambos a `requireAdmin`. El de users usaba `user.rol as UserRole`, un cast crudo en vez de `stringToUserRole` |
| **`items:ver` muerto en la matriz** | ⏸️ **Sin resolver, a propósito.** Aplicarlo a los GET del catálogo rompería el alta de líneas de OC para un rol con `ordenes_compra:crear` pero sin `items:ver` (`views/item-combobox.tsx:62-79`). Quedó **firmado** en `GET_SIN_GATE_A_PROPOSITO` con el motivo; destrabarlo es decisión de producto |

**Dos reglas duras nuevas para que no vuelva a pasar:** `src/app/(dashboard)/page-authz.test.ts`
(toda página del dashboard con guarda server-side y sin `"use client"`) y un segundo describe en
`route-authz.test.ts` (los GET llevan gate **o quedan firmados en una allowlist con el motivo** —
convierte "sin gate por olvido" en "sin gate por decisión"). Ambas fallan el build.
Límite conocido de las dos: la detección es por archivo, no por método.

### D10 · Código muerto confirmado (0 importadores)
| Item | Evidencia |
|---|---|
| `views/ui/switch.tsx`, `views/ui/toggle.tsx` | grep → 0 |
| `lib/auth/index.ts` (barrel) | 0 importadores; todos usan los archivos directos |
| `GET\|POST /api/proyectos` | 0 consumidores; `orden-compra-form.tsx:185` manda `proyecto_id: null` fijo |
| `GET /api/items/categorias`, `POST /api/items/[id]/reactivate` | sin consumidor |
| `POST\|DELETE /api/facturas/[id]/imputaciones`, `GET /api/facturas/certificaciones-aprobadas` | sin consumidor (el form los hace por otra vía) |
| `POST /api/ordenes-compra/[id]/lineas`, `PUT\|DELETE /api/ordenes-compra/lineas/[lineaId]` | sin consumidor |
| paths `@/routes` y `@/database` en `tsconfig.json:26,28` | apuntan a carpetas ya borradas |
| símbolos: `transiciones::rolRequerido`, `factura-validation::CreateFacturaLineaSchema`, `::CreateImputacionSchema`, `certificacion-validation::CreateCertificacionLineaSchema`, `audit.service::ConsultaAuditoria`, `usuario.controller::Create/UpdateUsuarioData`, `enums::CajaTipo`, `factura.model::FacturaImputacion`, `base.repository::BaseRepositoryOptions` | 0 usos externos |

### D11 · Duplicación
- `/api/proveedores/[id]/activar` y `/suspender`: mismo handler con otro enum (~40 líneas clonadas). El resto del sistema resuelve esto con un `PATCH /[id]/estado`.
- `proveedores/[id]/editar/page.tsx:20-42` repite verbatim el `useEffect`+loading+error de `views/proveedor-detail-client.tsx:20-40`.
- `admin/usuarios/page.tsx:26-34` repite el guard de `admin/layout.tsx:19-30`.
- `use-orders` / `use-ordenes-pago` / `use-proveedores`: mismo esqueleto CRUD+toasts, tres veces.

### D12 · Inconsistencias que no rompen nada pero cuestan al leer
- **Barrel a medias**: `factura.controller` no está en `controllers/index.ts` → 21 rutas importan por barrel, 16 por path. El corte no es por módulo ni por antigüedad: es ruido.
- **3 formas de export en repos**: 7 `class`+static, 2 `const` híbrido, 2 `const` factory. El call-site (`X.metodo()`) es idéntico en los tres, así que la divergencia no compra nada.
- **`-detail` vs `-details`**: 2 vs 3 archivos, empate perfecto, sin mayoría que sirva de convención.
- **`admin/auditoria/page.tsx` = 231 líneas** de UI inline: la única page que no delega a una view (2.2× la siguiente).
- **Sin cobertura**: `auth.service.ts` (209 L), `auth.cookies.ts` (76 L), `audit.service.ts` (136 L) — los tres archivos con más superficie de seguridad de `lib/` — no tienen ningún test. Y `vitest.config.ts` usa `environment:"node"` + `include:["src/**/*.test.ts"]` → los hooks y componentes son **inalcanzables por construcción** (ni siquiera correrían con extensión `.tsx`).

---

## 4. Veredicto sobre "volver a MVC"

**No. La estructura de 4 capas YA ES MVC — es su forma correcta y madura. Colapsarla no simplificaría
nada: perdería la única propiedad verificable que hoy tiene el proyecto.**

El mapeo es directo y se sostiene con la evidencia de §2.5:

| MVC clásico | En este proyecto | Estado |
|---|---|---|
| **M**odel (datos) | `repositories/` + `models/` | Cero `.from()` fuera de repos; `models/` sin una sola función |
| **V**iew | `views/` + `app/**/page.tsx` | Páginas de 6-25 líneas que delegan a views |
| **C**ontroller | `app/api/**/route.ts` | Parsea request, autoriza, responde — **este es el controller real** |
| Service layer | `controllers/` (las clases `*Service`) | Cero acceso a datos; solo reglas |

Separar el "Model" gordo del MVC de los 70s en **datos (repositories) + tipos (models) + reglas (services)**
no es apartarse de MVC: es la evolución estándar del patrón, y es lo que hace testeable el proyecto.
La prueba concreta: los 9 tests de services mockean el repo y **corren sin base de datos**. Con las capas
colapsadas eso no existe — cada test necesitaría Supabase, y el trabajo perdería su cobertura de las
reglas críticas (regla del 100%, numeración, mass-assignment, anti auto-lockout).

**Lo que hay que colapsar es la CONFUSIÓN, no las capas.** El autor no está mirando un problema de
arquitectura, está mirando un problema de rotulado y de cajones:

1. La carpeta se llama `controllers/` pero adentro hay `Services`, y los controllers de verdad están en `app/api/`. → **el nombre miente.**
2. `views/` tiene 54 archivos de dos naturalezas. → **el cajón está mezclado.**
3. `shared/` tiene 44 archivos de ocho naturalezas. → **el cajón es un tacho.**

Ninguna de esas tres cosas se arregla colapsando capas. Se arreglan renombrando una carpeta y moviendo
dos grupos de archivos. **El objetivo correcto es clarificar, no colapsar.**

Y para la tesis: una arquitectura de 4 capas verificada (0 `.from()` fuera de repos, medido con grep en
todo `src/`) es un **mérito defendible**. "Volvimos a MVC de 3 carpetas" sería un retroceso que habría
que justificar ante el tribunal, no un logro.

---

## 5. Estructura objetivo propuesta

Criterio: **mínimos movimientos, máxima ganancia de claridad.** Cada movimiento tiene que responder
"¿qué pregunta del autor contesta?". Los que no contestan ninguna, no entran.

```
src/
├── app/                    ← INTOCABLE (Next.js). 43 rutas + 25 páginas
├── middleware.ts           ← INTOCABLE (Next.js solo lo busca acá)
│
├── repositories/           ← sin cambios: 13 archivos, única capa con .from()
├── services/               ← RENOMBRADO desde controllers/ (los archivos: *.service.ts)
├── models/                 ← sin cambios: 11 archivos de tipos
│
├── views/                  ← SOLO pantallas de dominio: 27 → 30 archivos
│   └── (entran los 3 de components/items/, sale views/ui/)
│
├── components/             ← chrome + genéricos de UI
│   ├── ui/                 ← MOVIDO desde views/ui/ (convención shadcn) + list-shell + form-root-error
│   ├── theme-provider.tsx  ├── theme-toggle.tsx  ├── user-menu.tsx
│   ├── app-sidebar.tsx     ← desde views/
│   ├── crear-button.tsx    ← desde views/
│   ├── status-badge.tsx + status-colors.ts   ← desde shared/
│   └── auth-context.tsx    ← desde shared/
│
├── hooks/                  ← NUEVA: los 5 use-* de negocio desde shared/
│
├── lib/                    ← infraestructura server-only (la regla que ya cumple hoy)
│   ├── auth/               + permissions-server.ts   ← desde shared/
│   ├── audit/
│   ├── supabase/
│   ├── route/              ← NUEVA: handle-route-error, http-error, parse-id, crud-route, estado-route
│   └── utils.ts            ← cn (desde shared/utils.ts) — la ruta que components.json ya declara
│
└── shared/                 ← queda SOLO lo genuinamente compartido: 44 → 17
    ├── validation/         ← los 8 schemas Zod + create-schemas.test.ts
    ├── permissions.ts + permissions-catalog.ts   (isomorfos, los únicos que lo son)
    ├── api-client.ts       (cliente HTTP del browser)
    └── date-utils · format-utils · search-utils · toast-helpers
```

Movimientos **deliberadamente NO propuestos**, con el motivo:

| Descartado | Por qué |
|---|---|
| Colapsar capas a MVC de 3 carpetas | §4 — perdería testeabilidad sin ganar nada |
| Tocar `app/` o los route groups | Next.js los exige; están bien |
| Mover `middleware.ts` | Next.js solo lo busca en raíz o `src/` |
| Carpeta `src/domain/` para `totales.ts`+`transiciones.ts` | 2 archivos no justifican una carpeta de primer nivel. Van a `services/` en el Paso 6 o se quedan; el que importa es que dejen de estar junto a `formatCurrency` |
| Unificar las 3 formas de export de repos | Churn mecánico en 9 archivos, call-site idéntico, cero cambio de comportamiento |
| `-detail` → `-details` | Cosmético puro (ya marcado B9 en el changelog) |
| Carpetas separadas `src/validations/`, `src/permissions/`, `src/lib/format/`, `src/lib/ui/` | Multiplican carpetas de primer nivel para resolver un problema de 3-8 archivos. `shared/validation/` alcanza |
| `use-mobile.ts` a `views/ui/` | 1 import; se mueve gratis junto con el paso de hooks o se queda |

---

## 6. Plan de migración por pasos

**Contrato de cada paso** (aplica a los 8, sin excepción):

- Un paso = un lote independiente = un commit. Ningún paso depende de que el siguiente exista.
- **Gate obligatorio antes de commitear**, los tres en verde:
  ```bash
  npx tsc --noEmit && npm test && npm run build
  ```
- **El número de tests debe ser idéntico antes y después.** Registrar el baseline con `npm test` ANTES
  del Paso 1 y compararlo en cada paso. *(Nota: el brief dice 159 y `CLAUDE.md` dice 282 — hay 23
  archivos `*.test.ts`. El gate no es un número absoluto sino "el mismo número que el baseline".)*
- Movimientos con `git mv` (preserva historia). Imports con find/replace del alias completo — nunca
  parcial: reemplazar `@/views/ui/` (con la barra) y no `@/views`.
- Si un paso no cierra en verde: `git checkout .` y se replantea. No se acumulan pasos rotos.
- **Ningún test se borra.** Si un test se mueve, se mueve; no se reescribe.

---

### Paso 0 — Documentar sin mover nada *(0 riesgo, resuelve ~60% del problema declarado)*

**Qué se hace:** un `README.md` de 5-10 líneas en `repositories/`, `controllers/`, `models/`, `views/`,
`views/ui/`, `components/`, `shared/` y `lib/`, diciendo qué va ahí, qué no, y con qué otra capa habla.
Más el bloque de §1 de este documento pegado en `CLAUDE.md`.

**Imports a actualizar:** ninguno.
**Verificación:** `npm run build` (debería ser no-op — solo se agregaron `.md`).

> **Honestidad ponytail:** si el problema es "miro `src/` y no entiendo qué hace cada cosa", esto lo
> contesta con cero riesgo. Los pasos 1-8 valen igual, pero este es el que tiene mejor relación
> claridad/riesgo de todo el plan y debería ir primero **aunque se hagan todos los demás**.

---

### Paso 1 — Borrar lo muerto *(limpieza previa: menos archivos que mover después)*

**Qué se toca:**
- Borrar `src/views/ui/switch.tsx` y `src/views/ui/toggle.tsx` (0 importadores, verificado).
- Borrar `src/lib/auth/index.ts` (barrel con 0 importadores).
- Borrar los paths muertos `@/routes` y `@/database` de `tsconfig.json:26,28`.
- Opcional: `npm uninstall @radix-ui/react-switch @radix-ui/react-toggle` si no los usa otra primitiva.

**Imports a actualizar:** ninguno (por definición: nadie los importa).
**Verificación:** `npx tsc --noEmit && npm test && npm run build`. Los tres deben quedar idénticos al baseline.

---

### Paso 2 — `views/ui/` → `components/ui/` *(el movimiento de mayor ROI del plan)*

**Qué se mueve:** las 25 primitivas restantes (tras el Paso 1) de `src/views/ui/` a `src/components/ui/`.
Después de este paso, `ls src/views` devuelve **solo pantallas de negocio**.

**Imports a actualizar:** **142 sentencias en 46 archivos** (medido con grep).
```bash
# find/replace exacto, con la barra final para no tocar "@/views/..."
@/views/ui/  →  @/components/ui/
```
Los archivos de `views/ui/` **no tienen imports relativos entre sí** (todo va por alias `@/`), así que
el movimiento no requiere tocar nada adentro salvo lo del Paso 3.

**Verificación:** `npx tsc --noEmit` (caza cualquier import huérfano) + `npm test` + `npm run build`.
Riesgo bajo: 0 runtime, 0 config de Tailwind (`content` ya cubre `./src/**/*`).

---

### Paso 3 — Arreglar `components.json` y `cn` *(cierra el smell latente D3)*

**Qué se hace:**
- Mover `src/shared/utils.ts` (que exporta `cn`) → `src/lib/utils.ts`, que es **la ruta que
  `components.json` ya declara**. No hay que editar el JSON para esto.
- Editar `components.json`: `"hooks": "@/hooks"` queda válido después del Paso 6; `"ui"` y `"utils"`
  ya apuntan bien tras los Pasos 2 y 3.

**Imports a actualizar:** **25 sentencias** (`@/shared/utils` → `@/lib/utils`), casi todas en `components/ui/**`.
**Verificación:** el gate de tres + prueba real de que el CLI quedó sano:
```bash
npx shadcn@latest add tooltip --overwrite
```
(debe escribir en `src/components/ui/` e importar de `@/lib/utils`. Si escribe bien, `git checkout` el
archivo y listo — era solo la prueba.)

---

### Paso 4 — Sacar los componentes React de `shared/` y ordenar la frontera views↔components

**Qué se mueve** (7 archivos, un solo lote porque todos responden a la misma pregunta "¿dónde vive un componente?"):

| Desde | Hacia | Motivo |
|---|---|---|
| `shared/auth-context.tsx` | `components/auth-context.tsx` | Es un componente React, no un util |
| `shared/status-badge.tsx` + `shared/status-colors.ts` | `components/` (juntos) | Acoplamiento 1:1; `status-colors` tiene un solo consumidor |
| `views/app-sidebar.tsx` | `components/app-sidebar.tsx` | Chrome de layout, hermano de `user-menu`/`theme-toggle` |
| `views/crear-button.tsx` | `components/crear-button.tsx` | Genérico, sin dominio |
| `views/list-shell.tsx`, `views/form-root-error.tsx` | `components/ui/` | Primitivas de layout/RHF |
| `components/items/*` (3) | `views/item-selector.tsx`, `views/item-combobox.tsx`, `views/item-quick-create-dialog.tsx` | Dominio items. **Borra el barrel** `components/items/index.ts` y unifica a kebab-case |

**Imports a actualizar:** ~13 (`auth-context`) + 11 (`status-badge`) + 1 + 5 + 5 + 4 + 1 (barrel de items) ≈ **40 sentencias**.
**Verificación:** el gate de tres. Ojo particular con `auth-context` (13 importadores, casi todos client).

---

### Paso 5 — Mover la infra HTTP server-only de `shared/` a `lib/route/` *(el paso de seguridad)*

**Qué se mueve:** los 5 archivos del grupo B a `src/lib/route/`:
`handle-route-error.ts`, `http-error.ts`, `parse-id.ts`, `crud-route.ts`, `estado-route.ts` — **con sus 5 tests**.
Más `shared/permissions-server.ts` (+ su test) → `src/lib/auth/permissions-server.ts`.
Más `shared/route-authz.test.ts` → `src/app/api/route-authz.test.ts` (testea el árbol de rutas, no `shared/`).

**Por qué es el paso con más valor de fondo:** después de esto, la regla "todo lo de `lib/` es
server-only" pasa a ser **verdadera y completa**, y ningún módulo server-only queda a un autocompletado
de distancia de un hook cliente.

**Bonus de una línea por archivo** (hacerlo en este mismo commit): agregar `import 'server-only'` en
los 6 archivos movidos. Convierte 6 riesgos latentes en errores de build. Requiere `npm i server-only`
— **es la única dependencia nueva que este plan contempla, y es un paquete oficial de Next.js de 0 KB
en runtime.** Si se prefiere respetar "nada de dependencias nuevas" al pie de la letra: omitir el bonus,
el movimiento vale igual.

**Imports a actualizar:** 92 (grupo B) + 52 (`permissions-server`) = **144 sentencias**. Es el lote más
grande; el find/replace es mecánico y `tsc` caza el 100% de los errores.
**Verificación:** el gate de tres. Verificar además que `route-authz.test.ts` sigue escaneando bien tras
el movimiento (su path de escaneo es relativo al repo, no al test — revisar el archivo antes de moverlo).

---

### Paso 6 — Hooks a `src/hooks/`

**Qué se mueve:** `use-orders`, `use-ordenes-pago`, `use-proveedores`, `use-dashboard`, `use-reportes` →
`src/hooks/`. `use-mobile.ts` → `src/components/ui/use-mobile.ts` (1 importador, es de shadcn).

**Imports a actualizar:** 6 sentencias. Es el paso más barato del plan.
**Verificación:** el gate de tres. Después de este paso, `"hooks": "@/hooks"` de `components.json` es verdad.

---

### Paso 7 — `shared/validation/` y sacar el dominio del cajón

**Qué se mueve:**
- Los 8 `*-validation.ts` → `src/shared/validation/` (+ `create-schemas.test.ts` y `proyecto-validation.test.ts`).
- `shared/totales.ts` y `shared/transiciones.ts` (+ sus 2 tests) → `src/services/` (Paso 8) o
  `src/controllers/` si el Paso 8 no se hace. Dejan de ser vecinos de `formatCurrency`.

**Imports a actualizar:** ~30 (Zod) + 11 (dominio) = **41 sentencias**.
**Verificación:** el gate de tres.

Tras este paso `shared/` queda con **17 archivos**: `validation/` (10), los 2 de permisos isomorfos,
`api-client.ts`, y los 4 utils de presentación. Un `ls` que se entiende de un vistazo.

---

### Paso 8 — `controllers/` → `services/` *(opcional; el que cierra la confusión de nombres)*

**Qué se hace:** `git mv src/controllers src/services`, y cada `x.controller.ts` → `x.service.ts`
(+ sus 9 tests). La clase ya se llama `XService`: tras esto, **carpeta, archivo y símbolo dicen lo mismo**.
De paso: agregar `export * from './factura.service'` al barrel (hoy falta — es el origen de las dos
convenciones de import).

**Imports a actualizar:** **37 líneas** de import externo (21 por barrel `@/controllers`, 16 por path
`@/controllers/x.controller`) + **20 imports relativos internos** + **20 renombres de archivo**.
Total ~57 sentencias, **cero cambios de lógica**.

**Verificación:** el gate de tres. Al ser puro rename, `tsc --noEmit` es prueba suficiente de completitud.

**Recomendación:** hacerlo, pero **último y en un commit aislado**, sin ningún otro cambio mezclado.
Es el paso que contesta directamente la confusión reportada por el autor, y para la tesis vale
documentado como "corrección de nomenclatura de capas". Si se decide no hacerlo, el Paso 0 (un README
en `controllers/` explicando por qué se llama así) cubre el 80% del beneficio con 0% del riesgo.

---

### Resumen del plan

| Paso | Qué | Imports a tocar | Riesgo | ¿Recomendado? |
|---|---|---|---|---|
| 0 | READMEs por carpeta | 0 | nulo | **Sí, primero, siempre** |
| 1 | Borrar muerto (2 primitivas, 1 barrel, 2 paths) | 0 | nulo | Sí |
| 2 | `views/ui/` → `components/ui/` | 142 | bajo | **Sí — máximo ROI** |
| 3 | `cn` → `lib/utils.ts` + `components.json` | 25 | bajo | Sí |
| 4 | Componentes fuera de `shared/` + frontera views↔components | ~40 | bajo | Sí |
| 5 | Infra HTTP + `permissions-server` → `lib/` | 144 | medio | **Sí — mayor valor de fondo** |
| 6 | Hooks → `src/hooks/` | 6 | nulo | Sí |
| 7 | `shared/validation/` + sacar dominio | ~41 | bajo | Sí |
| 8 | `controllers/` → `services/` | ~57 | bajo | Opcional, último, aislado |

**Corte sugerido si hay poco tiempo: Pasos 0 + 1 + 2.** Con eso `views/` queda limpio, el CLI de shadcn
deja de ser una bomba, y cada carpeta tiene un README que la explica — que es literalmente lo que el
autor pidió. Los pasos 4-8 son mejoras reales pero de retorno decreciente.

---

## 7. Riesgos y qué NO tocar

### Restricciones que toda propuesta de este documento respeta

1. **Cero pérdida de funcionalidad.** Todo el plan es movimiento de archivos y renombres. Ningún paso
   cambia una condición, un cálculo, un query ni una respuesta HTTP.
2. **Seguridad de imports.** El proyecto usa el alias `@/` en el 100% de los imports entre carpetas;
   `npx tsc --noEmit` detecta cualquier import roto de forma exhaustiva. Cada paso deja
   `npx tsc --noEmit`, `npm run build` y `npm test` **en verde**, con el mismo conteo de tests que el baseline.
3. **No se toca `src/app/**` ni los route groups.** Next.js los exige y están correctos (§2.2).
4. **No se colapsan las capas** de datos ni de negocio (§4).
5. **Los tests se mueven, nunca se borran.** Los 23 archivos `*.test.ts` siguen existiendo al final.
6. **Nada de dependencias nuevas** — con una sola excepción explícita y opcional: `server-only` en el
   Paso 5, que puede omitirse sin invalidar el paso.

### Riesgos concretos, por paso

| Riesgo | Dónde | Mitigación |
|---|---|---|
| Find/replace parcial rompe imports sanos | Paso 2: reemplazar `@/views` en vez de `@/views/ui/` destruiría los 27 imports de vistas de dominio | Reemplazar **siempre con la barra final**. `tsc` lo caza igual, pero el diff sería enorme |
| `route-authz.test.ts` escanea rutas por path | Paso 5 | Leer el archivo **antes** de moverlo; si el path de escaneo es relativo al test, ajustarlo en el mismo commit |
| El CLI de shadcn queda a medias | Paso 3 | Verificar con un `shadcn add` real y descartarlo después |
| `auth-context.tsx` tiene 13 importadores casi todos client | Paso 4 | Mover solo, sin agrupar con otros cambios de ese lote si aparece ruido |
| `next build` es muy lento en esta máquina | Todos | Documentado: OneDrive sincroniza `.next` y "Collecting build traces" puede pasar los 5 min. Cierra en exit 0 igual — no es un fallo |
| Conteo de tests ambiguo (159 vs 282) | Todos | Registrar el baseline con `npm test` antes del Paso 1 y comparar contra ese número, no contra la documentación |
| Historia de git se pierde si se copia en vez de mover | Todos | `git mv` siempre |

### Qué NO tocar, bajo ningún concepto

- **`src/app/**`** — estructura, route groups `(auth)`/`(dashboard)`, nombres de `page.tsx`/`route.ts`/`layout.tsx`.
- **`src/middleware.ts`** — Next.js lo busca solo en la raíz o en `src/`. Su contenido tampoco: el
  `getJwtSecret` lazy y el fail-closed están así por razones documentadas (rompía `next build`).
- **La separación repositories / services / models.** Es el activo del trabajo.
- **Las reglas de la DB** (triggers del 100%, numeración, gates) — fuera del alcance de este documento.
- **Los huecos de autorización de D9** — son bugs de seguridad reales, pero **arreglarlos es un cambio de
  comportamiento**, no un refactor de ubicación. Van en una fase aparte, con su propio test, para que el
  diff del refactor siga siendo verificable como "solo se movieron archivos".
- **Los candidatos a muerto de D10 que son rutas de API** (`/api/proyectos`, `imputaciones`, `lineas`…) —
  no tienen consumidor **hoy**, pero borrar endpoints es decisión de producto, no de limpieza. Se listan
  para que el humano decida, no para que este plan los toque.
