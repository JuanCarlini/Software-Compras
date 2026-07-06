# Gestión Uno — Memoria de proyecto

> Actualizado: 2026-07-06. Leer antes de tocar código. Si el código y este archivo divergen, manda el código: verificar y actualizar acá. Al cierre de cada sesión relevante, actualizar el Changelog y las Discrepancias.

## Qué es

ERP de **control de compras y pagos** para constructoras y desarrolladoras inmobiliarias. Propósito dual: **producción real** + **Trabajo de Diploma** (Ingeniería en Sistemas, UAI Rosario; autor Juan Carlini; el desarrollador con quien se interactúa es Juan Andrés; profesor Pablo Andrés Audoglio). Toda decisión de arquitectura no trivial debe poder justificarse en la tesis — si se toma una, avisar que puede valer documentarla en los anexos.

**Fuera de alcance (no proponer):** contabilidad completa, stock/inventario, integraciones bancarias/contables, licitaciones, emisión de facturación electrónica propia.

## Flujo de negocio central y reglas no negociables

```
Orden de Compra (OC) → Certificación → Factura → Orden de Pago (OP)
```

- **Estados en la DB en ESPAÑOL**: `factura_estado = borrador/aprobado/rechazado/anulado` (equivale a draft/approved/rejected/cancelled). **"pagado" existe SOLO en `op_estado`** (`pendiente/aprobado/rechazado/pagado`). Jamás agregar un estado "pagada" a facturas — si alguien lo pide, frenar y consultar.
- **OC : pagos = 1 : N** — pagos parciales; nunca asumir un único pago por OC.
- **Nada se salta etapas**: no facturar sin certificación aprobada, no pagar sin factura aprobada.
- **Regla del 100% en certificaciones** (no certificar más del 100% de una línea de OC): es regla declarada del negocio pero **HOY NO ESTÁ IMPLEMENTADA en ninguna capa** y el schema no tiene FK cert↔OC que la soporte (ver Discrepancias #4).
- **Migraciones de enums en Postgres**: patrón de tipo temporal (crear tipo nuevo → migrar datos → dropear el viejo). Ejemplo real: `supabase/migration_factura_estados.sql`.

## Stack (verificado en package.json)

Next.js **15.2.4** (App Router) · React 18 · TypeScript 5 · Tailwind 3.4 + shadcn/Radix · React Hook Form + Zod · `@supabase/supabase-js` 2.74 (PostgreSQL en Supabase, solo como DB) · **JWT custom**: `bcryptjs` + `jsonwebtoken` · Deploy: Vercel.

- Gestor de paquetes: **npm** (unificado 2026-07-02; se eliminó `pnpm-lock.yaml`). `npm run build` **verde**. Deps clave: `jose` (verificación de firma JWT en el middleware), `@supabase/supabase-js` (cliente `service_role`). `@supabase/ssr` **removido 2026-07-06** (dead tras el refactor de seguridad).
- Env vars (`.env.local` local + **env vars del proyecto en Vercel**): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `JWT_SECRET`, **`SUPABASE_SERVICE_ROLE_KEY`** (requerida desde 2026-07-04: todo el acceso a datos server-side la usa; sin ella la app hace **fail-fast** y no arranca).
- **Proyecto Supabase vigente: "Gestion Uno v2"** (`ahhpzfoausrpfkumtzzx`, us-east-2), creado 2026-07-02. El anterior (`qudxsciydyynimvpbgfm`) quedó pausado >90 días y es irrecuperable vía dashboard/API; sus backups se pueden bajar desde el dashboard si algún día hacen falta los datos viejos. **RLS habilitado (deny-anon) en las 17 tablas desde 2026-07-04** (`migration_rls_deny_anon.sql`): la anon key no accede a nada; el acceso legítimo entra por API routes con `service_role`.
- Scripts: `dev`, `build`, `lint`, `start` (no hay script de test).

## Arquitectura y convenciones

```
src/
├── app/            # App Router: (auth), (dashboard), api/ por módulo
├── controllers/    # Lógica de negocio. Archivos *.controller.ts, clases *Service
├── models/         # Tipos/enums TS (UserRole, modelos por dominio)
├── views/          # Componentes de dominio (forms/lists/details) + views/ui (shadcn)
├── components/     # Genéricos (theme, user-menu) + components/items/
├── lib/auth/       # auth.service.ts (JWT+bcrypt), auth.cookies.ts
├── lib/audit/      # audit.service.ts (bitácora server-side, T06)
├── lib/supabase/   # service.ts (service_role, SERVER-ONLY) — sin client.ts (browser ya no habla con Supabase)
├── shared/         # permissions.ts, permissions-server.ts (requireAuth/requireAdmin), validaciones Zod, use-*.ts
└── middleware.ts   # Verifica FIRMA del JWT con jose (ver Auth)
```

- Clases de negocio: `OrdenCompraService`, `CertificacionService`, `FacturaService`, `OrdenPagoService`, `ProveedorService`, `ProyectoService`, `ItemService`. Excepciones legacy con nombre `*Controller`: `ConfiguracionController` y `ReporteController` (mocks con TODOs). (`CajaService` y `AuthController` borrados 2026-07-06 — código muerto; el tipo `AuthUser` vivo sale de `models/user.model.ts` para la UI y de `lib/auth/auth.service.ts` para el server.)
- **Orden al construir un módulo**: controller/service → API route → UI. No invertir.
- Antes de crear un componente, copiar el patrón de uno existente (ej. `src/views/certificacion-detail.tsx`).
- Editar antes que duplicar. Reescritura completa solo cuando el archivo cambia sustancialmente.

## Base de datos (leer `supabase/schema.sql` antes de tocar tablas)

PK `BIGINT GENERATED ALWAYS AS IDENTITY` en todas las `gu_*` (**no UUID** — las docs viejas que mencionan UUID están obsoletas).

Tablas en `schema.sql`: `gu_roles`, `gu_usuario`, `gu_proveedores`, `gu_proyectos`, `gu_ordenesdecompra`, `gu_lineasdeordenesdecompra`, `gu_certificaciones`, `gu_lineasdecertificacion`, `gu_facturas`, `gu_lineasdefactura`, `gu_facturas_certificaciones` (N:M con UNIQUE factura+cert), `gu_ordenesdepago`, `gu_lineasdeordenesdepago` (FK `factura_id` — acá se traza OP→Factura), `gu_lineasdeordenesdepagocaja` (cajas), `gu_auditoria`, `gu_audit_log`.

- `gu_items` + `item_id` en líneas de OC viven en `migration_items.sql` / `migration_items_lineas_oc.sql` — **no están en schema.sql** (schema.sql está incompleto respecto a la DB real).
- `gu_lineasdecertificacion.linea_oc_id` (desde 2026-07-04, `migration_cert_oc_trazabilidad.sql`): FK nullable a `gu_lineasdeordenesdecompra` — traza OC→Cert por línea; NULL = línea libre. El trigger `check_certificacion_max_100` impide certificar más del 100% de una línea de OC (excluye rechazadas, lock `FOR UPDATE`).
- `moneda_enum (ARS/USD/EUR)` solo se usa en `gu_ordenesdecompra`; `gu_ordenesdepago` **no** tiene columna moneda.
- Enums: `oc_estado` (borrador/en_aprobacion/aprobado/rechazado/anulado), `cert_estado` (borrador/aprobado/rechazado), `factura_estado`, `op_estado`, `forma_pago_enum` (transferencia/cheque/efectivo/retencion).

## Autenticación y permisos (estado real — endurecido 2026-07-04 sesión de seguridad)

**Arquitectura de acceso a datos (decisión clave):** el browser **NO** habla con Supabase. Todo el CRUD pasa por API routes de Next.js que corren server-side con `service_role` (`src/lib/supabase/service.ts`, fail-fast si falta la key) y aplican los roles en la capa de aplicación. La anon key quedó sin acceso a nada (RLS deny-all). Es **defensa en profundidad**: perímetro (middleware JWT) + aplicación (requireAuth/requireAdmin + permisos) + datos (RLS + triggers). Esto resuelve las viejas discrepancias #11 (UI directo a Supabase) y el hallazgo de seguridad máximo de la auditoría.

- **JWT custom**: `AuthService.login/verifyToken/changePassword` (`src/lib/auth/auth.service.ts`), bcrypt 10 rounds, JWT 7 días firmado con `JWT_SECRET`. **`signup` eliminado** (registro público cerrado; altas solo por admin). **`JWT_SECRET` sin fallback**: el sistema falla explícito si no está seteada (en `auth.service.ts` y `middleware.ts`).
- `middleware.ts` **verifica la firma del JWT** con `jose` (HS256) en cada request protegido — cookie ausente/inválida/falsificada → 401 en `/api`, redirect+limpieza en páginas. Ya no es solo "presencia de cookie".
- `requireAuth()` / **`requireAdmin()`** (`shared/permissions-server.ts`). Las rutas `/api/admin/*` exigen admin. El acceso a datos server-side con service_role hace que la capa API sea el único punto de entrada.
- Roles en código: `admin/supervisor/usuario/readonly` (`UserRole` + `shared/permissions.ts`). En la DB: 1=admin, 2=usuario, 3=supervisor, 4=readonly (minúsculas).
- **Gestión de usuarios/roles completa** (`/admin/usuarios`, tabs Usuarios/Roles): `UsuarioService` (alta, edición, baja lógica=inactivo, reset de clave por admin) + `RolService` (CRUD del catálogo; los 4 roles del sistema protegidos contra rename/delete; roles con usuarios no se borran). Reset de clave por admin = mecanismo de recuperación (sin email). Cambio de clave propio en el menú de usuario (`components/user-menu.tsx` → `POST /api/auth/change-password`). Guardas anti auto-lockout. Todo auditado en la bitácora.
- **RLS activo (deny-anon) en las 17 tablas** (`migration_rls_deny_anon.sql`) + `REVOKE EXECUTE` de las funciones de trigger (`fn_audit_log`, `check_certificacion_max_100`) para que no sean RPC-invocables. Con JWT custom NO se hacen policies por rol (PostgREST ve todo como anon); el control de rol vive en la capa app. Pendiente menor: `search_path` mutable en `update_gu_items_updated_at` (WARN del advisor, pre-existente).

## Estado real por módulo (verificado 2026-07-02)

| Módulo | Estado |
|---|---|
| Órdenes de compra | Completo: CRUD + líneas + IVA + items, rutas y vistas |
| Certificaciones | CRUD + numeración `CERT-YYYY-NNN` (max+1 sin lock → race condition posible). **Trazabilidad a líneas de OC + regla 100%** (trigger DB + saldo en form) desde 2026-07-04 |
| Facturas | CRUD + puente `gu_facturas_certificaciones` + flujo proveedor→certs aprobadas. Enum correcto |
| Órdenes de pago | CRUD + líneas con FK a factura + cajas + formas de pago. Sin columna moneda propia |
| Proveedores | CRUD + activar/suspender con chequeo de permisos (vía API routes) |
| Items | CRUD + búsqueda + categorías + reactivar |
| Seguridad (T02/T04) | **Endurecido 2026-07-04**: middleware con firma JWT, acceso a datos server-only (service_role), RLS deny-anon en 17 tablas, CRUD usuarios+roles, reset/cambio de clave, signup cerrado. Ver sección Auth |
| Auditoría (T06) | **Implementado 2026-07-04**: control de cambios por triggers en `gu_audit_log` (OC/cert/factura/OP, valores ant/nue) + bitácora server-side en `gu_auditoria` (login/logout + crear/aprobar/rechazar/anular/activar/suspender por API) + pantalla `/admin/auditoria` con búsqueda combinada. Falta redactar el anexo |
| Configuración | **MOCK** — `ConfiguracionController` lleno de TODOs "conectar con base de datos real" |
| Reportes | **MOCK** — `ReporteController` ídem |
| Tests | **No existe ningún test automatizado** (los 44 casos del anexo 13.5 de la tesis son solo documentación) |

## Discrepancias documentación/prompt vs código (pendientes de resolver)

1. `docs/AUTH_SETUP.md` y `docs/DOCUMENTACION_PROYECTO.md` describen Supabase Auth + `perfiles_usuario` + UUID → **obsoleto** (real: JWT custom + `gu_usuario` BIGINT). Actualizar solo con OK de Juan Andrés.
2. ~~`@supabase/ssr` faltante en package.json → build roto~~ **RESUELTO 2026-07-02**: agregado `@supabase/ssr` ^0.12.0, gestor unificado en npm, build verde. El cliente Supabase quedó **sin el genérico `Database`** (el `types.ts` viejo describía un schema inexistente y se eliminó); upgrade path: `supabase gen types typescript` y reponer el genérico.
3. ~~La carpeta no es repo git~~ **RESUELTO**: `git init` (rama `main`) el 2026-07-04. Desde 2026-07-06 hay remote **`origin` = `github.com/JuanCarlini/Software-Compras`** (PÚBLICO, HTTPS autenticado vía `gh`, cuenta JuanCarlini) y la rama de trabajo **`dev`** está pusheada ahí (= `d608bcd`). ⚠️ La historia local arranca de un `git init` fresco y **no comparte ancestro** con el `main` que ya existía en el remote (último push 2026-04-23): `origin/dev` y `origin/main` son líneas independientes — un merge/PR `dev→main` daría "unrelated histories" (todos los archivos como diff). El push de `dev` **no tocó** `main`. Sin secretos trackeados (`.env*` en `.gitignore`, verificado antes del push). El nombre de repo viejo `Gestion-Uno` que citaban las docs era incorrecto; el real es `Software-Compras`.
4. ~~Regla del 100% en certificaciones: declarada, no implementada, sin FK cert↔OC~~ **RESUELTO 2026-07-04**: `gu_lineasdecertificacion.linea_oc_id` (FK nullable a líneas de OC; NULL = línea libre) + trigger `check_certificacion_max_100` en la DB (con `FOR UPDATE` para concurrencia) + pre-validación en form con saldo visible. Migración: `supabase/migration_cert_oc_trazabilidad.sql`.
5. ~~Roles: seed capitalizado vs código en minúsculas; mapeo id↔rol contradictorio~~ **RESUELTO 2026-07-02 en la DB nueva**: roles sembrados en minúsculas — 1=admin, 2=usuario (default de signup), 3=supervisor, 4=readonly. `supabase/seed.sql` y `scripts/cleanup-roles.sql` del repo siguen desactualizados respecto a esto.
6. `package.json`: `"git": "^0.1.5"` removido 2026-07-02; **`tunnelmole`, `multer`, `recharts` y `@radix-ui/react-toast` removidos 2026-07-06** (sin imports en `src/`). `recharts` se re-agrega cuando se implemente el gráfico real de A02. Tras la poda, `npm audit` bajó de 16 a **8 vulnerabilidades (1 crítica)** pendientes de revisar.
7. La tesis/prompt describen middleware con control de permisos por ruta — no implementado (solo presencia de cookie).
8. OP multi-moneda declarada; el schema no la soporta.
9. `schema.sql` no incluye las tablas de items (viven solo en migraciones).
10. **"Suspendido" de proveedores no existe en la DB**: el enum `estado_activo_inactivo` solo tiene activo/inactivo, pero la UI ofrece "suspender". Desde 2026-07-02 suspender escribe `inactivo` (antes escribía `'Suspendido'`, que habría fallado contra Postgres). Decidir con Juan Andrés si se agrega el estado `suspendido` al enum (migración con patrón de tipo temporal) o se elimina el concepto de la UI.
11. La UI llama a los `*Service` **directamente desde componentes client** (via `createBrowserClient` + anon key), no vía API routes: las API routes son parcialmente vestigiales y los checks de permisos de las rutas se bypassean. Relevante para el hardening y para el capítulo de seguridad de la tesis.

## Glosario de negocio

- **OC**: orden de compra — solicitud formal y autorizada a un proveedor.
- **Certificación**: confirmación de que lo pedido en la OC fue recibido/ejecutado (avance de obra).
- **Factura**: registro de la factura recibida del proveedor por lo certificado (no se emite facturación propia).
- **OP / orden de pago**: autorización y ejecución del pago; único documento con estado "pagado".
- **Caja**: fondo/medio desde el que se paga (`gu_lineasdeordenesdepagocaja.caja`, texto libre hoy).
- **Centro de costos**: en la práctica se materializa como proyecto (`gu_proyectos`).
- **CUIT**: identificador fiscal argentino del proveedor.

## Herramientas de este entorno (plan de uso, en orden de prioridad)

**Memoria y contexto**
- Este `CLAUDE.md`: memoria de proyecto. Regla: actualizar Changelog + Discrepancias al cierre de cada sesión. No reescribir a ciegas — leer y editar.
- Memoria persistente propia del asistente (directorio de memoria por proyecto) para preferencias de Juan Andrés y estado entre sesiones.
- Búsqueda de código: Glob/Grep/Read nativos de Claude Code (más las herramientas ctx/context-mode para analizar archivos grandes sin cargarlos al contexto). Reemplazan a Desktop Commander MCP, que también está conectado si hiciera falta.
- Git: **disponible** (repo desde 2026-07-04; ver Discrepancia #3). Remote `origin` = `github.com/JuanCarlini/Software-Compras` (público), rama `dev` pusheada. Los pushes se siguen confirmando con Juan Andrés antes (regla dura).

**Coding**
- Edición: herramientas nativas (Edit para cambios puntuales, Write para reescrituras). Misma estrategia ya establecida: quirúrgico en archivos estables, reescritura en refactors grandes.
- Ejecución local: PowerShell/Bash → `npm install`, `npm run build`, `npm run lint` (npm es el gestor único desde 2026-07-02; build verde).
- Supabase: **MCP oficial conectado** (tools `list_tables`, `execute_sql`, `apply_migration`, `generate_typescript_types`, etc.) — permite inspeccionar el schema real y aplicar migraciones directamente sobre "Gestion Uno v2". **Confirmar siempre antes** de cualquier cambio de schema o borrado de datos. Con `generate_typescript_types` se puede reponer el genérico `Database` del cliente (upgrade path de la discrepancia #2).

**Documentación de tesis**
- Anexos Word: skill `docx` / librería npm `docx`. **Preferencia de Juan Andrés: entregar el texto para revisar antes de generar el .docx** (generación colaborativa, no automática).
- Diagramas: draw.io vía XML generado por código.
- Anexos ya redactados: 13.1 Arquitectura, 13.2 Seguridad, 13.3 Métricas UCP, 13.4 Riesgos, 13.5 Pruebas (44 casos), 13.6 Patrones, 13.7 Reporte, 13.8 Instructivo.

**Reglas duras transversales**: cambios de schema, borrados de datos y pushes a git se confirman con Juan Andrés antes de ejecutar. No agregar scope excluido. Decisiones de arquitectura → mencionar si valen para los anexos.

**Regla código vs. documentación de tesis (permanente, 2026-07-04):** son dos trabajos distintos, con distinto momento y lugar. Los **anexos** del Trabajo de Diploma (Auditoría, Resguardo, Patrones, reencuadres T04/T05/T08) son **redacción académica**: se hacen en **sesiones dedicadas aparte**, NUNCA dentro de una sesión de código, y NUNCA como archivos sueltos en el repo (ni `.md` ni `.docx` en `src/`/`docs/`). Flujo: texto para revisar/copiar → recién después `.docx` con la skill de documentos. **Pendiente para la sesión de documentación**: el anexo de Patrones ya redactado **sobre-afirma** (dice Singleton, Factory, Observer-via-hooks, Strategy-via-Zod, Repository) — hay que reconciliarlo con la tríada GoF que termine siendo *real* en el código (hoy: Facade de facto sin documentar; faltan creacional y comportamental genuinos).

## Auditoría Carpeta Modelo 2020.1 (corrida 2026-07-04 — informe completo en `docs/AUDITORIA_CARPETA_MODELO_2026-07-04.md`)

Estado por ítem: T01 Arquitectura ⚠️ (3 capas efectivas, sin capa repositorio — los 8 services mezclan negocio+queries, 71 `.from()`) · Patrones GoF ❌ (0 genuinos; Facade argumentable; anexo 13.6 documenta "Repository" que ni es GoF ni está implementado) · T02-04 Seguridad ⚠️ (login/logout/bcrypt-10 OK; sin CRUD usuarios/roles, sin reset/recuperar clave, `changePassword` muerto; **RLS off en 17 tablas + anon key en browser = DB abierta, hallazgo máximo**) · T06 Auditoría ❌ ALTA (tablas existen, cero writes en src) · T07 Resguardo ❌ ALTA (plan Free sin backups automáticos, nada documentado) · A02 Reportes ⚠️ (indicadores reales OK, cero gráficos — recharts instalado sin uso) · T08 Dígitos verif. → reencuadre · T09 Pruebas ❌ ALTA (cero tests; los 44 casos son solo Word) · BD ✅/⚠️ (FKs/3FN OK; docs y schema.sql desactualizados) · A01/A03/D01-03 ⚠️/❌ · Extra: ESLint sin configurar (lint no corre).

**Decisiones de Juan Andrés (2026-07-04) sobre las preguntas abiertas:** (1) T04 → el rol plano de 4 roles **satisface** el espíritu de Composite; no se hace árbol de permisos (queda como reencuadre documental en la tesis). (2) T05 → multi-idioma **fuera de alcance** confirmado; no se implementa Observer por idioma (si hace falta un comportamental para la tríada GoF, buscar otro caso). (3) T07 → **sí**, alcanza con `pg_dump` programado propio + instructivos de resguardo/restauración. (4) T08 → **sí**, constraints+FKs+triggers de PostgreSQL cumplen el espíritu; reencuadre documental, no se implementan checksums. (5) T01 → **refactor real a 4 capas** (extraer repositorios de los `*Service`; de paso habilita tests sin DB, sinergia con T09). (6) Anexos Auditoría y Resguardo → **hay que redactarlos** (además del trabajo escrito, más adelante).

**Top 5 (orden de trabajo confirmado, arrancando 2026-07-04):** 1) ~~T06 auditoría funcional~~ **HECHO**, 2) ~~seguridad RLS/auth~~ **HECHO 2026-07-04**, 3) T09 tests, 4) T07 resguardo (pg_dump + instructivos), 5) A02 gráfico + tríada GoF. Pendiente transversal: T01 refactor a repositorios (ahora más fácil: los `*Service` ya son el único punto de acceso a datos server-side). Anexos (Auditoría, Resguardo, reconciliación Patrones) = redacción en sesión aparte, texto antes de .docx.

## Changelog de sesiones

- **2026-07-06 (b)** — **Consolidación en `dev` + prep de deploy.** T06 (`43a021e`) y seguridad (`90081dd`) commiteados en `main` y mergeados a `dev` (que ya traía la limpieza `d608bcd`). Conflicto solo en este changelog; `package.json`/barrels auto-merge OK; `@supabase/ssr` removido (dead tras borrar client.ts/server.ts). Build verde post-merge. **Deploy**: proyecto Vercel `software-compras` (team `juanandrescarlini-2112`, id `prj_WIhRHEAc24ZMCboRLBdB9L0N4oAQ`) — **requiere `SUPABASE_SERVICE_ROLE_KEY` en las env vars del proyecto** o la app no arranca (fail-fast). El MCP de Vercel conectado NO escribe env vars (solo deploy/lectura): se cargan a mano en el dashboard. (El changelog `2026-07-04` sin sufijo, más abajo, es un duplicado del `(a)` por el merge — inofensivo.)
- **2026-07-06** — **Limpieza de código muerto (safe-tier, ponytail audit)**. Borrados 16 archivos + 4 deps; `npm run build` **verde** (exit 0, type-check + lint OK). Deps removidas: `recharts`, `@radix-ui/react-toast`, `multer`, `tunnelmole` (`npm audit` 16→8 vulns). Borrado: wrapper recharts `ui/chart` (nada lo importa; se re-agrega con el gráfico de A02); sistema de toast Radix paralelo (`ui/toast`, `ui/toaster`, `shared/use-toast`) — el toast real es **sonner**; `CajaService` + `caja.model` (consultaban tabla `cajas` inexistente); páginas de scaffolding solo-por-URL (`create-admin`, `debug-user`, `api/auth/debug`); `AuthController` muerto; `producto.model`; scripts one-shot (`run-items-migration*`, `update-user-role`, `cleanup-roles.sql`); `shared/temp.txt`; bloque `experimental` no-op en `next.config.mjs`. **Dos ajustes más allá del borrado puro, forzados por el requisito de build-verde** (la auditoría los había dado por seguros): (a) `ItemQuickCreateDialog.tsx` **sí** consumía `use-toast` → migradas sus 2 llamadas a `showSuccessToast`/`showErrorToast` de `shared/toast-helpers` (sonner, ya montado), comportamiento idéntico; (b) `auth-context.tsx` repuntado a **`@/models`** (no a `@/lib/auth` como decía el plan): el `AuthUser` de `lib/auth` no tiene campo `rol` y ~10 vistas hacen `stringToUserRole(user.rol)` → repuntar ahí rompía el build; el de `models/user.model.ts` es shape-compatible con lo que devuelve `/api/auth/me`. `git diff --stat`: 23 archivos, 3925 borrados (2307 = churn de `package-lock.json`), ~1618 líneas de fuente/scripts/config muertas. Commit `d608bcd`. **Git remote + push**: se configuró `origin` = `github.com/JuanCarlini/Software-Compras` (público, HTTPS vía `gh`) y se pusheó la rama **`dev`** (= `d608bcd`, los 3 commits). El `main` remoto preexistente (push 2026-04-23) tiene historia no relacionada con la local (ver Discrepancia #3); `dev` no lo tocó.

- **2026-07-04** — **Git + trazabilidad Cert↔OC con regla del 100%**. (1) `git init` (rama main) + commit baseline `0d4155f`; `.claude/settings.local.json` ignorado; sin remote todavía. (2) Migración `cert_oc_trazabilidad`: `linea_oc_id` nullable en líneas de certificación + trigger `check_certificacion_max_100` (regla en capa de datos, lock `FOR UPDATE`, mensaje en español). (3) `CertificacionService.getLineasOCDisponibles` + ruta `GET /api/certificaciones/lineas-oc-disponibles?proveedorId=` + form con selector de línea de OC (prefill, saldo visible, pre-validación) + detalle muestra OC vinculada + compensación anti-huérfanas en `create` + POST devuelve 422 con el mensaje del trigger. (4) Fix numeración: año hardcodeado 2025 → año corriente (cert y OP). **Verificado E2E**: disponible 100 → cert 60 (201) → disponible 40 → exceso 50 rechazado (422); trigger probado también con 100% justo. Queda de demo OC-2026-001 + CERT-2025-001 en la DB. **Decisión de arquitectura (candidata a anexo tesis)**: la regla del 100% vive en un trigger de Postgres, no en la app — con la UI hablando directo a Supabase (discrepancia #11), cualquier validación solo en app/API es bypasseable; la capa de datos es el único punto de control garantizado.
- **2026-07-04 (d)** — **Seguridad (prioridad #2 del Top 5) — HECHA y verificada E2E.** Decisiones de Juan Andrés: acceso backend-only + RLS candado; recuperar clave = reset por admin; signup solo por admin. (1) **Middleware** reescrito con verificación de **firma JWT** (`jose`, HS256) — cookie falsa → 401/redirect; **`JWT_SECRET` sin fallback** (fail-fast). (2) **`src/lib/supabase/service.ts`** (service_role, server-only, fail-fast); los 8 `*Service` + audit + rutas admin migrados a él; **eliminado el browser-direct**: form/details/hooks de OC/OP/proveedores/reportes ahora van por API routes (de paso: OC create hace cabecera+líneas en un POST con compensación; fix bug de "pagar OP" que mandaba columnas inexistentes). Borrados `lib/supabase/client.ts` y `server.ts`. (3) **Signup público eliminado** (página/ruta/form/método). (4) **Gestión usuarios/roles**: `UsuarioService`+`RolService`, rutas `/api/admin/users` (POST/PUT/DELETE baja lógica) + `/reset-password` + `/api/admin/roles` CRUD + `requireAdmin()`; UI `/admin/usuarios` con tabs; `changePassword` conectado (`/api/auth/change-password` + dialog en user-menu). (5) **RLS deny-anon** en 17 tablas (`migration_rls_deny_anon.sql`) + `REVOKE EXECUTE` en funciones de trigger. **Verificado E2E**: login 200, cookie falsificada→401, API sin cookie→401, alta/baja usuario OK, change-password valida clave actual; **ataque directo con anon key a la DB → SELECT devuelve `[]` e INSERT 401**, app sigue viva por service_role, bitácora sigue registrando. Advisor: los 17 ERROR `rls_disabled` → INFO `rls_enabled_no_policy` (deny intencional). Build verde. **Sin commit** (main aún en `cc87297`; T06+seguridad sin aterrizar).
- **2026-07-04 (c)** — **T06 Auditoría implementada** (arranque del Top 5 post-auditoría; Juan Andrés resolvió las 6 preguntas abiertas — ver sección de arriba). Diseño **híbrido confirmado**: (1) migración `auditoria_t06` — trigger `fn_audit_log` (SECURITY DEFINER, search_path fijo) en `gu_ordenesdecompra/gu_certificaciones/gu_facturas/gu_ordenesdepago` que escribe control de cambios a `gu_audit_log` con `to_jsonb(OLD/NEW)`; `usuario_id` pasó a nullable; hook `app.audit_user_id` para atribución futura. (2) `AuditService` (`src/lib/audit/audit.service.ts`) escribe la bitácora a `gu_auditoria` server-side (best-effort, no bloqueante) — cableado en login/logout y en los POST/PUT de certificaciones/facturas/OP/proveedores (crear/aprobar/rechazar/anular/activar/suspender). (3) `GET /api/admin/auditoria` (admin-only, filtros usuario/tabla/acción/desde/hasta, fuente bitacora|cambios) + pantalla `/admin/auditoria` (tabs + búsqueda combinada + diff de campos) + link en sidebar admin. **Verificado E2E**: login→crear cert→aprobar→logout generan bitácora atribuida; `gu_audit_log` reconstruye borrador→aprobado con valores; filtro combinado OK. Build verde. **Gap honesto documentado**: las operaciones que van directo del browser a Supabase (crear OC, aprobar/pagar OP, activar/suspender vía hook) quedan en el control de cambios SIN usuario hasta el refactor de seguridad (prioridad #2). **Falta**: redactar el anexo de Auditoría (texto para revisar antes de .docx). Sin commit todavía.
- **2026-07-04 (b)** — **Auditoría Carpeta Modelo (solo lectura)**. Checklist técnico-académico completo corrido contra el código real; informe con evidencia archivo:línea en `docs/AUDITORIA_CARPETA_MODELO_2026-07-04.md`; resumen y preguntas abiertas en la sección de arriba. Sin cambios de producción (solo se agregó el informe y esta memoria). Ejecutado: build ✅ verde, lint ❌ sin config, advisors de Supabase (RLS off en 17 tablas). Próximo paso: Juan Andrés prioriza del Top 5.
- **2026-07-04 (a)** — **Git + trazabilidad Cert↔OC con regla del 100%**. (1) `git init` (rama main) + commit baseline `0d4155f`; `.claude/settings.local.json` ignorado; sin remote todavía. (2) Migración `cert_oc_trazabilidad`: `linea_oc_id` nullable en líneas de certificación + trigger `check_certificacion_max_100` (regla en capa de datos, lock `FOR UPDATE`, mensaje en español). (3) `CertificacionService.getLineasOCDisponibles` + ruta `GET /api/certificaciones/lineas-oc-disponibles?proveedorId=` + form con selector de línea de OC (prefill, saldo visible, pre-validación) + detalle muestra OC vinculada + compensación anti-huérfanas en `create` + POST devuelve 422 con el mensaje del trigger. (4) Fix numeración: año hardcodeado 2025 → año corriente (cert y OP). **Verificado E2E**: disponible 100 → cert 60 (201) → disponible 40 → exceso 50 rechazado (422); trigger probado también con 100% justo. Queda de demo OC-2026-001 + CERT-2025-001 en la DB. **Decisión de arquitectura (candidata a anexo tesis)**: la regla del 100% vive en un trigger de Postgres, no en la app — con la UI hablando directo a Supabase (discrepancia #11), cualquier validación solo en app/API es bypasseable; la capa de datos es el único punto de control garantizado.

- **2026-07-02 (a)** — Fase 0 (reconocimiento completo del repo) + creación de este archivo. Sin cambios de código. Hallazgos clave: @supabase/ssr faltante en package.json (build roto en instalación limpia), sin validación 100% ni FK cert↔OC, auth solo en 8 rutas API, roles inconsistentes seed↔código, Configuración y Reportes son mocks, cero tests, carpeta sin git.
- **2026-07-02 (c)** — **Recuperación de la base de datos**. El proyecto Supabase original (`qudxsciydyynimvpbgfm`) llevaba >90 días pausado: irrecuperable vía dashboard y API (probado). Se creó **"Gestion Uno v2"** (`ahhpzfoausrpfkumtzzx`, us-east-2, $0/mes) vía MCP de Supabase; se aplicaron `schema.sql` + migraciones de items como 3 migraciones versionadas; seed con roles corregidos (1=admin, 2=usuario, 3=supervisor, 4=readonly — resuelve discrepancia #5), admin `admin@gestionuno.com`/`admin123`, proveedores y proyectos de ejemplo; `.env`/`.env.local` apuntados al proyecto nuevo. **Verificado en runtime**: login 200 con rol admin + GET /api/proveedores 200 con datos. Los datos viejos, si hicieran falta, se bajan con "Download backups" del dashboard del proyecto viejo.
- **2026-07-02 (b)** — **Reparación del build** (pedido por Juan Andrés). `npm run build` pasa de roto a verde. Cambios: `@supabase/ssr` ^0.12.0 agregado; npm como gestor único (pnpm-lock eliminado); dep basura `git` removida; `date-fns` fijado en ^3.6.0; eliminados `lib/supabase/types.ts` y `lib/supabase/queries/proveedores.ts` (legacy v0, schema inexistente); `producto.model` fuera del barrel (rompía el export de `UnidadMedida`); cliente Supabase sin genérico; ~25 archivos con fixes de tipos: ids string→number en rutas/hooks/vistas, `EstadoOrdenCompra` fantasma → `z.enum` real, schema de validación de OC realineado al modelo real, `orden-pago-list` realineada al modelo real (numero_op/fecha_op/total_pago + join proveedor en `OrdenPagoService.getAll`), suspender proveedor → `inactivo`, mocks de reportes tipados. **Pendiente**: verificación runtime contra la DB (login + CRUDs), decidir estado `suspendido` (discrepancia #10), resto de candidatos de la sesión (a).
