# Auditoría Backend — Gestión Uno

> **Actualización 2026-07-06 (post-fix):** **S1 y S2 RESUELTOS** — se implementó el helper `requireRole` + autorización por rol en todas las rutas mutantes, y se cerró el mass assignment de `estado` (server lo fija en create; Zod lo descarta). `tsc` y `build` en verde tras el cambio. Detalle al pie de cada hallazgo.
>
> **Fecha:** 2026-07-06 · **Alcance auditoría:** solo lectura · **Fecha fix S1/S2:** 2026-07-06 · **Rama:** `dev` · **Commit base:** `8f20643`
> **Verificación:** `npm run build` → **exit 0** (verde) · `npx tsc --noEmit` → **exit 0** · ESLint → **no corre** (no instalado) · tests → **ninguno**
> **Lentes aplicadas:** ponytail (escalera YAGNI/dead-code, activa toda la sesión) · superpowers (`verification-before-completion` → cada hallazgo marcado CONFIRMADO/PLAUSIBLE con trazado `archivo:línea`) · fullstack-dev-skills (code-reviewer / security-reviewer / architecture-designer / postgres-pro como marco de las 6 categorías).

---

## 1. Resumen ejecutivo

El backend **compila limpio** (build y `tsc` en verde) y la **base del perímetro de seguridad es sólida**: el middleware verifica la **firma** del JWT y es *fail-closed*, el acceso a datos es **server-only con `service_role`** (ningún secreto bajo `NEXT_PUBLIC_`, browser no habla con Supabase), RLS niega anon y `.env*` está fuera de git. Ese trabajo de endurecimiento de julio está bien hecho y verificado.

El problema **no está en el perímetro sino en la capa de aplicación**: el middleware **autentica pero no autoriza**. La grilla de roles (`admin/supervisor/usuario/readonly`) existe en `shared/permissions.ts` pero **casi no se aplica en las rutas**. El resultado es **Broken Access Control (OWASP A01)**: cualquier usuario logueado —incluido `readonly`— puede **crear y borrar** órdenes de compra, facturas, certificaciones, órdenes de pago y proveedores, y vía **mass assignment** puede **saltarse el workflow del negocio** (p. ej. crear una factura directamente en estado `aprobado`). Sumado a que solo 8 de 45 rutas validan input con Zod, la superficie de escritura está esencialmente sin control de autorización ni de forma.

En arquitectura, la deuda estructural declarada en `CLAUDE.md` se confirma: **no hay capa de repositorio** (93 llamadas `.from()` embebidas dentro de los `*Service`), el naming de capa es incoherente (`*.controller.ts` exportando clases `*Service`), y **dos módulos “feature” — Reportes y Configuración — son mocks en memoria** que no persisten nada y se rompen en serverless. En patrones GoF, la tesis **sobre-afirma**: lo único real es un *Facade* de facto; Singleton/Factory/Observer/Strategy/Repository **no están implementados**.

### Los 5 problemas más graves

| # | Severidad | Problema |
|---|-----------|----------|
| **S1** | ✅ **RESUELTO** (era 🔴 Alto) | **Falta autorización por rol** en rutas mutantes → `readonly` podía borrar/crear documentos. **Resuelto** con `requireRole` en todas las mutaciones. |
| **S2** | ✅ **RESUELTO** (era 🔴 Alto) | **Mass assignment** de `estado` (factura naciendo `aprobado`, salteando el flujo). **Resuelto**: el server fija el estado inicial + Zod lo descarta al crear. |
| **A1** | 🟠 Alto (estructural) | **Sin capa de repositorio**: 93 `.from()` mezclando negocio y persistencia en los `*Service`; dominio anémico; bloquea tests. **CONFIRMADO** |
| **S4** | 🟡 Medio | **Sin validación Zod** en 37/45 rutas ni en query params (parcialmente aliviado por S2 en create de OC/OP). **CONFIRMADO** |
| **D1/D2** | 🟡 Medio | **Reportes y Configuración son mocks** en memoria (feature fantasma, no persiste, roto en serverless). **CONFIRMADO** |

---

## 2. Tabla priorizada de hallazgos

| ID | Sev | Categoría | archivo:línea | Descripción | Impacto | Fix sugerido | Estado |
|----|-----|-----------|---------------|-------------|---------|--------------|--------|
| **S1** | ✅ RESUELTO | Seguridad | `shared/permissions-server.ts` (`requireRole`), `shared/permissions.ts` (`ROLES_ESCRITURA`/`ROLES_DESTRUCTIVO`) + 16 rutas | ~~Handlers DELETE/POST sin chequeo de rol~~ | ~~`readonly` borra/crea documentos~~ | **Hecho**: `requireRole` en toda mutación (crear/editar → escritura; borrar → destructivo). Verificado: 0 rutas mutantes sin authz | RESUELTO 2026-07-06 |
| **S2** | ✅ RESUELTO | Seguridad | `controllers/{factura,orden-compra,orden-pago,certificacion,proveedor}.controller.ts` (create), `shared/{orden-compra,orden-pago}-validation.ts` | ~~`create` inserta el body crudo con `estado`~~ | ~~factura nace `aprobado` salteando el workflow~~ | **Hecho**: el server fija `estado` inicial en cada create (factura/OC/cert→`borrador`, OP→`pendiente`, prov→`activo`); Zod descarta `estado` al crear OC/OP | RESUELTO 2026-07-06 |
| **S3** | 🟡 Medio | Seguridad | `api/auth/login/route.ts:6` | Login sin rate-limiting ni lockout | Fuerza bruta de credenciales | Rate-limit por IP/email (Upstash/@vercel + backoff) | CONFIRMADO |
| **S4** | 🟡 Medio | Seguridad | 37/45 `route.ts` (solo 8 usan Zod) | Sin validación de body ni de query params (`parseInt(id)` sin chequear NaN) | Mass assignment (ver S2), inputs inválidos llegan a la DB, 500s | Schema Zod `safeParse` por ruta; validar y `Number.isInteger` en ids | CONFIRMADO |
| **S5** | 🟢 Bajo | Seguridad | `.env.local`, `middleware.ts:10` | `JWT_SECRET` adivinable (ya notado en `CLAUDE.md`), sin rotación | Falsificación de tokens si el secreto es débil | Rotar a 256-bit aleatorio; documentar rotación | PLAUSIBLE (config) |
| **A1** | 🟠 Alto | Arquitectura | los 8 `controllers/*.controller.ts` (93× `.from()`) | Negocio + queries Supabase en la misma clase; sin repositorio; `models/` solo tipos (anémico) | Imposible testear sin DB; lógica duplicada; cambio de persistencia caro | Extraer `*Repository` (I/O) y dejar `*Service` con reglas puras — habilita tests (sinergia T09) | CONFIRMADO |
| **A2** | 🟡 Medio | Arquitectura/Carpetas | `controllers/*.controller.ts` que exportan `class *Service`; `ReporteController`/`ConfiguracionController` conviven con nombre `Controller` | Naming de capa incoherente | Confunde la capa real; fricción de lectura | Unificar: o todo `*Service` (recomendado) o todo `*Controller` | CONFIRMADO |
| **A3** | 🟢 Bajo | Arquitectura | `controllers/index.ts:1`, `models/index.ts:1` | Barrels `export *` arrastran los mocks y todo el árbol a cada import | Acoplamiento, riesgo de ciclos, peor tree-shaking | Exports nombrados o import directo por módulo | CONFIRMADO (ciclos: PLAUSIBLE) |
| **D1** | 🟡 Medio | Código muerto | `controllers/reporte.controller.ts:15` | `let reportesTemporales: Reporte[] = []` en memoria; todas las rutas `/api/reportes/*` son fake | Feature fantasma: no persiste, cada instancia serverless tiene su copia → roto aun como demo | Implementar contra Supabase o eliminar el módulo y su UI | CONFIRMADO |
| **D2** | 🟡 Medio | Código muerto | `controllers/configuracion.controller.ts:8` | Devuelve objetos hardcodeados; `update*` no persiste; `/api/configuracion/*` fake | Igual que D1; el usuario “guarda” y no pasa nada | Implementar o eliminar | CONFIRMADO |
| **D3** | 🟢 Bajo | Código muerto | `shared/errors.ts:6-55` | 7 clases de error; solo `ValidationError/NotFoundError/BusinessLogicError` se usan y **únicamente en los mocks** (D1/D2). `AuthenticationError/AuthorizationError/ConflictError` y la base sin uso | Jerarquía muerta que muere del todo al sacar los mocks; los `*Service` reales tiran el error crudo de Supabase | Podar a lo usado o adoptarla en todos los controllers | CONFIRMADO |
| **D4** | 🟢 Bajo | Código muerto | `shared/permissions.ts:29,36` | `canAprobarDocumento` e `isSupervisorOrAbove` **definidos, 0 usos** | Dead code; sugiere que “aprobar” quizá no está gateado por rol (ver S1) | Eliminar o cablear en las rutas de aprobación | CONFIRMADO |
| **D5** | 🟢 Bajo | Código muerto | `views/ui/` (21 de 48) | Componentes shadcn sin referencia: `accordion, aspect-ratio, avatar, breadcrumb, calendar, carousel, collapsible, context-menu, drawer, hover-card, input-otp, menubar, navigation-menu, pagination, progress, quick-filters, radio-group, resizable, scroll-area, slider, toggle-group` | Scaffolding muerto (churn, superficie de deps) | Borrar los no usados (shadcn se re-agrega on-demand) | CONFIRMADO |
| **D6** | 🟢 Bajo | Código muerto | `package.json` (deps) | `date-fns` declarada, **0 imports** en `src/` y config | Dep innecesaria | `npm rm date-fns` | CONFIRMADO |
| **P1** | 🟡 Medio | Buenas prácticas | `api/facturas/route.ts:9-12`, `api/proveedores/route.ts:9-12` | `catch` devuelve `[]` con **status 200** ante error | El cliente no distingue “vacío” de “falló la DB”; oculta incidentes | Devolver 500 con error genérico; loguear server-side | CONFIRMADO |
| **P2** | 🟢 Bajo | Buenas prácticas | `use-orders.ts:35,51`, `factura.controller.ts:85`, `certificacion.controller.ts` (5×) | `any` en fronteras (`orderData: any`, `create(data: any)`) | Se pierde type-safety justo donde entra input externo | Tipar con los modelos + inferencia de Zod | CONFIRMADO |
| **P3** | 🟢 Bajo | Buenas prácticas | 131 `console.*` (8 `.log`, 123 `.error`) | Logging crudo productivo; algunos loguean el objeto de error entero | Ruido en logs de Vercel; posible fuga de detalle interno | Logger con niveles; no loguear objetos crudos de error | CONFIRMADO |
| **P4** | 🟢 Bajo | Buenas prácticas (DRY) | `use-orders.ts:8`, `use-ordenes-pago.ts:11`, `use-proveedores.ts` | Helper `api()` idéntico triplicado | Duplicación | Extraer `shared/api-client.ts` | CONFIRMADO |
| **F3** | 🟡 Medio | Tooling/Carpetas | `package.json` (sin dep eslint), `next.config.mjs:3-5` | ESLint **no instalado ni declarado**; el “Linting” del build se saltea; `ignoreDuringBuilds:false` da falsa señal de que corre | Cero análisis estático; reglas de Next/a11y/hooks no se aplican | Instalar `eslint`+`eslint-config-next`, agregar `.eslintrc`, correr en CI | CONFIRMADO |
| **F4** | 🟡 Medio | Tooling | (no existe `**/*.test.*`) | Sin ningún test automatizado (los 44 casos del anexo son solo Word) | Cero red de seguridad; refactor A1 riesgoso | Vitest + primeros tests de servicios (post-repositorio) | CONFIRMADO |
| **F1** | 🟢 Bajo | Doc vs código | `supabase/schema.sql`, `docs/AUTH_SETUP.md`, `docs/DOCUMENTACION_PROYECTO.md` | `schema.sql` sin `gu_items` ni `linea_oc_id`; docs describen Supabase Auth + UUID (obsoleto) | Onboarding engañoso | Regenerar schema (`supabase db dump`); marcar docs viejas como obsoletas | CONFIRMADO |

---

## 3. Detalle por categoría

### Categoría 1 — Código muerto o inútil

- **Mocks disfrazados de feature (D1, D2)** — `reporte.controller.ts:15` y `configuracion.controller.ts:28` no tocan la DB: devuelven arrays/objetos en memoria con `setTimeout` para simular latencia y decenas de `// TODO: Conectar con base de datos real`. Las 8 rutas `/api/reportes/*` y las 8 `/api/configuracion/*` están cableadas a estos mocks. En Vercel (serverless) cada invocación puede caer en otra instancia → el array `reportesTemporales` ni siquiera es consistente dentro de una sesión. **Es lo más “dead code” del repo, y encima expuesto como API.**
- **Jerarquía de errores muerta (D3)** — `shared/errors.ts` define 7 clases; el trazado muestra uso **solo** en `configuracion.controller.ts`, `reporte.controller.ts` y `api/configuracion/sistema/route.ts`. Al remover D1/D2 queda sin ningún consumidor. `AuthenticationError`, `AuthorizationError`, `ConflictError` ya hoy tienen 0 usos.
- **Funciones de permiso muertas (D4)** — `canAprobarDocumento` e `isSupervisorOrAbove`: definidas, 0 referencias. (La aprobación real, donde existe, reusa `canAnularDocumento`.)
- **Componentes shadcn sin uso (D5)** — 21/48 en `views/ui/` sin ninguna referencia entrante.
- **Dependencia sin uso (D6)** — `date-fns`.
- **Por verificar (no confirmado):** `src/routes/routes.config.ts` — no se trazó su consumo; revisar si algo lo importa.

### Categoría 2 — Jerarquías / arquitectura

- **Ausencia de repositorio (A1)** — 93 `.from(...)` embebidos, concentrados en los `*Service` (`orden-compra` 14, `factura` 13, `certificacion` 12, `item` 11, `rol` 9, `orden-pago` 7…). Cada `*Service` mezcla: generación de números, reglas, y I/O Supabase. `models/` son solo tipos/enums → **dominio anémico**. Son **3 capas efectivas** (route → service+persistencia → DB), no 4. Consecuencia práctica: no se puede testear la lógica sin una DB real (bloquea F4).
- **Naming de capa (A2)** — archivos `*.controller.ts` que exportan `class *Service` (Facade), y dos parientes con nombre real `*Controller` (los mocks). Inconsistencia que confunde qué es cada capa.
- **Barrels (A3)** — `controllers/index.ts` y `models/index.ts` con `export *`. Importar un service arrastra los mocks y todo el árbol; peor para tree-shaking y con riesgo de ciclos (no confirmado que existan hoy).

### Categoría 3 — Buenas prácticas

- **Errores tragados (P1)** — GET de facturas/proveedores devuelven `[]` con **200** en el `catch`. Un fallo de DB se ve como “no hay datos”. El resto de GETs sí devuelven 500 → inconsistencia.
- **`any` en fronteras (P2)** — hooks (`orderData: any`) y `create(data: any)` en los controllers: el input externo entra sin tipo hasta el `insert`.
- **Logging (P3)** — 123 `console.error` + 8 `console.log`. Aceptable como baseline, pero varios loguean el objeto de error crudo (potencial detalle interno en logs de Vercel).
- **DRY (P4)** — helper `api()` triplicado.
- **Menor (P5)** — semilla de numeración hardcodeada `'FACT-2025-001'` (`factura.controller.ts:98`); el año siguiente ya se calcula bien, pero el literal 2025 es un olor.

### Categoría 4 — Estructura de carpetas

- **ESLint no-op (F3)** — no hay dep `eslint` ni `eslint-config-next` en `package.json`, `node_modules/eslint` ausente; `next build` saltea el linting silenciosamente. `next.config.mjs` declara `ignoreDuringBuilds:false` con un comentario “✅ Habilitar ESLint”, lo que da una **falsa sensación** de que corre.
- **Sin tests (F4)**.
- **Doc desalineada (F1)** — `schema.sql` incompleto (items y `linea_oc_id` viven solo en migraciones); `docs/AUTH_SETUP.md`/`DOCUMENTACION_PROYECTO.md` describen Supabase Auth + UUID, que ya no es el diseño.
- **`shared/` como cajón de sastre** — mezcla validaciones Zod, hooks `use-*`, permisos, utils, toast y status. Funciona, pero convendría separar `hooks/`, `validation/`, `auth/`. (Opinión, no defecto.)

### Categoría 5 — Seguridad (lo más serio)

**Lo que está bien (verificado):**
- `middleware.ts:19` verifica **firma** JWT (HS256, `jose`) y es *fail-closed* (`:11-16` sin secreto → token inválido). Matcher cubre todo `/api` salvo estáticos.
- `lib/supabase/service.ts` — `service_role` server-only, *fail-fast*; `SUPABASE_SERVICE_ROLE_KEY` sin `NEXT_PUBLIC_`; el único `NEXT_PUBLIC_*` es la URL. **Ningún** `createBrowserClient`/`@supabase/ssr` en `src`: el browser realmente no habla con Supabase (el `.from(` de `use-reportes.ts:97` es `Array.from`, no Supabase).
- Cookie `httpOnly`, `secure` en prod, `sameSite:lax`, `path:/` (`auth.cookies.ts:12`). Login no devuelve el token en el body.
- `.env*` en `.gitignore`, **nada** de `.env` trackeado (`git ls-files` limpio). RLS deny-anon (migración presente).

**Los agujeros (el núcleo del informe):**

> ✅ **S1 y S2 resueltos el 2026-07-06.** El fix se describe en cada bullet abajo. El texto original del hallazgo se mantiene (en pasado) para trazabilidad de la tesis.

- **S1 — Broken Access Control.** *(RESUELTO — ver ✅ al final del bullet.)* El middleware **autentica pero no autoriza por rol**. `requireAuth()` (`permissions-server.ts:31`) solo comprueba que exista usuario; **no** mira el rol. Y la mayoría de mutaciones ni siquiera lo llaman. Trazado de handlers DELETE (verificado leyendo cada body): `ordenes-pago/[id]:88`, `ordenes-compra/[id]`, `facturas/[id]`, `certificaciones/[id]`, `proveedores/[id]`, `items/[id]`, `ordenes-compra/lineas/[lineaId]` → **cero checks**; solo corre el middleware (que deja pasar a cualquier logueado). Los POST de colección (`ordenes-compra`, `facturas`, `ordenes-pago`, `proveedores`, `proyectos`, `items`) tampoco chequean rol. Donde **sí** hay control es en `anular` (PUT reusa `canAnularDocumento`) y en `/api/admin/*` (`requireAdmin`). Neto: **un `readonly` puede crear y borrar OC, facturas, certificaciones, OP y proveedores.**
  **✅ RESUELTO (2026-07-06):** se agregó `requireRole(rolesPermitidos)` a `shared/permissions-server.ts` y dos grupos centralizados en `shared/permissions.ts` — `ROLES_ESCRITURA` (admin/supervisor/usuario, crear-editar) y `ROLES_DESTRUCTIVO` (admin/supervisor, borrar). Se aplicó a las 16 rutas mutantes que estaban abiertas (POST create de OC/factura/cert/OP/proveedor/proyecto/item; DELETE de OC/factura/cert/OP/proveedor/item; PUT de proveedor/item; líneas de OC). Sweep de verificación: **0 rutas mutantes sin autorización**. `readonly` queda en solo-GET. *(Pendiente menor, fuera de S1: `configuracion/*` y `reportes/*` siguen sin gate — son los mocks D1/D2; gatearlos como admin al implementarlos.)*
- **S2 — Mass assignment / bypass de workflow.** `factura.controller.ts:88` hace `const { lineas, certificaciones_ids, ...facturaData } = data` e `insert({ ...facturaData, numero_factura })`. El cliente controla todas las demás columnas, **incluida `estado`** → puede crear una factura directamente en `aprobado`, violando “no facturar sin certificación aprobada / nada se salta etapas”. Mismo patrón en `proveedor.controller.ts` (create) y en `ordenes-pago/[id]:56` (`update(id, data)` con el body crudo; el gate de rol solo cubre transiciones a `aprobado/rechazado/pagado`, no el resto de columnas ni otros valores de `estado`).
  **✅ RESUELTO (2026-07-06):** doble defensa. (1) El server **fija el `estado` inicial** en cada `create()` con un override tras el spread — factura/OC/cert → `borrador`, OP → `pendiente`, proveedor → `activo` — así, aunque el cliente mande `estado`, se pisa. (2) Se quitó `estado` de los esquemas Zod de **create** de OC y OP (Zod descarta la clave; sigue permitido en los de *update*, donde las transiciones ya están gateadas por rol). Cierra el bypass confirmado de factura-naciendo-aprobada. *(Pendiente menor: el `estado` a nivel de línea de OC/cert no se fuerza — el gate del workflow está en la cabecera.)*
- **S4 — Validación de input.** Solo 8/45 rutas usan Zod. `parseInt(id)`/`parseInt(...)` sin chequear `NaN` en varias rutas `[id]`. Sin whitelist de campos, S2 es inevitable.
- **S3 — Login sin rate-limiting** (`api/auth/login/route.ts`): valida formato de email y credenciales, pero no hay throttling ni lockout → fuerza bruta.
- **S5 — `JWT_SECRET`** adivinable/pendiente de rotar (ya anotado en `CLAUDE.md`; pertenece a config del deploy, no al código).
- **Triggers/DB (revisión estática):** `fn_audit_log` es `SECURITY DEFINER` **con** `SET search_path = public, pg_temp` (`migration_auditoria_t06.sql:24`) → correcto. `check_certificacion_max_100` (`migration_cert_oc_trazabilidad.sql:19`) es `SECURITY INVOKER` (default) → aceptable para un trigger que corre como `service_role`. Queda el WARN pre-existente de `search_path` mutable en `update_gu_items_updated_at` (bajo).

**Nota IDOR:** las rutas `[id]` no scopean por dueño, pero el dominio no tiene modelo de propiedad por usuario (todo el personal ve todos los documentos), así que el riesgo real es **autorización a nivel de rol (S1)**, no object-level IDOR clásico.

### Categoría 6 — Patrones de diseño

**Implementados de verdad:**
- **Facade (de facto, no documentado)** — los `*Service` ocultan el detalle de Supabase detrás de una API de dominio. Es el único patrón GoF argumentable.
- **Module/Barrel** — `index.ts` de `controllers`/`models` (patrón de módulo, no GoF; ver A3).
- **Invariantes por trigger** — regla del 100% y auditoría en Postgres. Es un patrón de *capa de datos*, valioso, pero **no es GoF**.

**Afirmados en la tesis pero AUSENTES en el código (brecha a reconciliar):**
- **Singleton** — no existe; `service.ts:8` crea una **instancia nueva por llamada** (lo opuesto a Singleton).
- **Factory** — no hay.
- **Observer “vía hooks”** — los hooks de React no son el patrón Observer GoF.
- **Strategy “vía Zod”** — Zod es validación de esquema, no Strategy.
- **Repository** — no está implementado (es, de hecho, lo que falta: A1).

**Recomendados (sin sobre-ingeniería):**
- **Repository** — el de mayor valor: extraer el I/O de los `*Service`. Resuelve A1 y habilita tests.
- **Strategy** — genuino candidato para la numeración de documentos (`OC-/CERT-/FACT-/OP-`, hoy duplicada) o para transiciones de estado; daría el patrón *comportamental* real que la tríada GoF de la tesis necesita.
- **Factory** — solo si la numeración/creación se vuelve polimórfica; hoy sería especulativo (YAGNI).

---

## 4. Inventario de patrones (resumen)

| Patrón | ¿Afirmado (tesis)? | ¿Implementado? | Evidencia |
|--------|--------------------|-----------------|-----------|
| Facade | (implícito) | ✅ de facto | los 8 `*Service` |
| Singleton | ✅ | ❌ | `service.ts:8` crea instancia por llamada |
| Factory | ✅ | ❌ | — |
| Observer (hooks) | ✅ | ❌ (no es GoF) | hooks React |
| Strategy (Zod) | ✅ | ❌ (no es GoF) | validación Zod |
| Repository | ✅ | ❌ | 93 `.from()` en services |

---

## 5. Quick wins (alto impacto / bajo esfuerzo)

1. ~~**`requireRole([...])`** — helper sobre `requireAuth` que compara rol, en cada handler mutante.~~ ✅ **HECHO 2026-07-06** (S1 cerrado).
2. ~~**Nunca aceptar `estado` del cliente en `create`.**~~ ✅ **HECHO 2026-07-06** (S2 cerrado; falta extender Zod-whitelist a factura/proveedor create para S4 completo).
3. **`npm rm date-fns`** y **borrar los 21 `views/ui/*` sin uso** — dead code, cero riesgo (D5, D6).
4. **Instalar ESLint** (`eslint` + `eslint-config-next` + `.eslintrc.json`) — activa el análisis estático que hoy no corre (F3).
5. **Devolver 500 en vez de `[]`/200** en los `catch` de GET facturas/proveedores (P1).
6. **Extraer `shared/api-client.ts`** — deduplica el helper `api()` (P4).

> Los cambios estructurales (A1 repositorio, D1/D2 reportes/config reales, F4 tests, S3 rate-limit) son proyectos aparte, no quick wins.

---

## 6. Fuera de alcance (no reportado como “falta”)

Contabilidad completa, stock/inventario, integraciones bancarias/contables, licitaciones y emisión de facturación electrónica propia — excluidos por definición del proyecto. No se evaluó la UI/UX ni los componentes `views/` de dominio salvo por dependencias de datos.

---

## 7. Comandos ejecutados y resultado

| Comando | Resultado |
|---------|-----------|
| `npm install` | exit 0 (deps instaladas; el clone venía sin `node_modules`) |
| `npm run build` (`next build`) | **exit 0** — verde. “Compiled with warnings”: warnings **internos de `jose`** (`dist/webapi/...`), no del código de la app. Fase de Linting **saltada** (ESLint ausente). |
| `npx tsc --noEmit` | **exit 0** — sin errores de tipos |
| `npm run lint` (`next lint`) | **no-op** — ESLint no instalado/declarado (F3) |
| tests | **no existen** (F4) |

---

*Auditoría de solo lectura. No se modificó código, schema ni git. A la espera de indicación para priorizar y corregir.*
