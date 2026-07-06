# Auditoría técnica contra Carpeta Modelo 2020.1 — Gestión Uno

**Fecha:** 2026-07-04 · **Auditor:** sesión Claude Code (solo lectura, sin cambios de producción)
**Base auditada:** commit `cc87297` (working tree limpio) + DB "Gestion Uno v2" (`ahhpzfoausrpfkumtzzx`)
**Ejecutado realmente:** `npm run build` → ✅ verde · `npm run lint` → ❌ no corre (sin config ESLint) · tests → no existen
**Nota:** los anexos .docx de la tesis no están en el repo — no se pudo verificar su contenido, solo si el código respalda lo que la memoria del proyecto dice que afirman.

---

## T01 — Arquitectura (mínimo 4 capas)

**Estado: ⚠️ Cumple parcialmente**
**Evidencia:**
- Capas físicas reales: `src/app`+`src/views` (UI), `src/controllers` (clases `*Service`), `src/models` (solo tipos/enums TS), `src/lib/supabase` (factoría de cliente).
- Los `*Service` mezclan reglas de negocio y acceso a datos en el mismo método: **71 llamadas `.from()` de Supabase repartidas en los 8 controllers** (ej. `certificacion.controller.ts` `create()`: genera numeración CERT-YYYY-NNN, inserta cabecera, inserta líneas y compensa errores, todo junto).
- `src/models` es dominio anémico (interfaces sin comportamiento). No existe capa Repositorio separada ni contextos de BD propios.

**Hallazgo:** contra el modelo de referencia (Dominio ↔ UI ↔ Aplicación ↔ Repositorio ↔ Contextos, + Abstracciones/Servicios) hay 3 capas efectivas. **Es un problema de arquitectura real, no solo documental**: no hay repositorios que aíslen la persistencia. Sobre ORM: `@supabase/supabase-js` es un query builder HTTP (PostgREST) sin mapeo de entidades, change tracking ni lazy loading → defendible que NO es un ORM en el sentido restringido por la cátedra; pero la ausencia de repositorios propios hace que la lógica hable directo con el cliente. No hay diagrama de componentes ni mapa de navegación en el repo.
**Prioridad: Media** (alta si el profesor exige las 4 capas literales — ver preguntas abiertas)

---

## Patrones de diseño (mínimo 3 GoF: creacional + estructural + comportamental)

**Estado: ❌ No cumple hoy**
**Evidencia:**
- Búsqueda de implementaciones clásicas (`getInstance`, `private constructor`, `subscribe/notify`, `EventEmitter`, factories): **cero resultados en `src/`**.
- Singleton: NO — `lib/supabase/client.ts:5-9` crea un cliente nuevo en cada llamada; no hay ninguna clase con instancia única.
- Observer: NO — `shared/auth-context.tsx` usa React Context (mecanismo del framework, no implementación propia); toasts = librería sonner.
- Estructural: **Facade es argumentable** — las clases `*Service` estáticas ocultan la persistencia a las vistas (`certificacion.controller.ts:6` etc.), pero hoy no está documentado como tal.
- La memoria del proyecto indica que el anexo 13.6 documenta el patrón **Repository**: (a) Repository no es GoF, (b) **no está implementado** (ver T01). Doble discrepancia documentación↔código.

**Hallazgo:** faltan un creacional y un comportamental genuinos; el estructural (Facade) existe de facto pero sin documentar. Lo que el anexo afirma no está respaldado por código.
**Prioridad: Alta** (requisito explícito de la guía, brecha con anexo ya redactado)

---

## T02/T03/T04 — Seguridad

**Estado: ⚠️ Cumple parcialmente, con hallazgos de seguridad reales de prioridad máxima**

| Funcionalidad | Estado | Evidencia |
|---|---|---|
| Iniciar sesión | ✅ | `api/auth/login/route.ts` → `AuthService.login` (JWT firmado, bcrypt.compare) |
| Cerrar sesión | ✅ | `api/auth/logout/route.ts:4-20` (borra cookie httpOnly) |
| Gestionar usuarios (alta/mod/baja por admin) | ❌ | `api/admin/users` solo tiene GET (listar); `[id]/role` solo PATCH de rol. Alta solo vía signup público. Sin edición ni baja |
| Resetear clave (admin) | ❌ | grep `reset/resetear`: cero resultados |
| Gestionar roles (CRUD del catálogo) | ❌ | roles sembrados por seed; sin rutas ni UI de gestión |
| Cambiar clave propia | ⚠️ | `AuthService.changePassword` existe (`auth.service.ts:237`) pero **ninguna ruta/UI la invoca** — funcionalidad muerta |
| Recuperar clave | ❌ | sin página ni flujo de recuperación |
| Hasheo bcrypt | ✅ | **10 rounds reales**: `auth.service.ts:123` y `:260` (`bcrypt.hash(password, 10)`) |
| Encriptación de otros datos sensibles (T03) | n/a? | no hay campos cifrados; el dato más sensible fuera de password es CUIT (público en AR). Requiere justificación escrita "no aplica" |

**Hallazgos de middleware/rutas (prioridad máxima):**
1. **RLS deshabilitado en las 17 tablas** — confirmado por el linter oficial de Supabase (nivel ERROR, `rls_disabled_in_public` en todas las `gu_*`). Como los `*Service` corren en el **browser** con la anon key (los controllers importan `lib/supabase/client.ts` → `createBrowserClient`), **cualquier visitante puede leer/escribir toda la base sin autenticarse**, incluida `gu_usuario` con los `password_hash`. Los checks de permisos de las API routes quedan decorativos.
2. `middleware.ts:13-19` solo verifica **presencia** de la cookie, no la firma del JWT — un valor arbitrario en `auth_token` pasa el middleware.
3. `requireAuth()` solo en 8 rutas; los GET/POST de colección (`/api/certificaciones`, `/api/ordenes-compra`, etc.) no validan identidad ni rol en el handler.
4. `JWT_SECRET` con fallback inseguro hardcodeado (`auth.service.ts:5`).
5. Superficie de debug en producción: página `/debug-user`, ruta `/api/auth/debug`, y página `/create-admin` que promete crear un admin (la API en realidad fuerza rol usuario — `api/auth/signup/route.ts:43` — código muerto/engañoso, conviene eliminarla igual).

**Prioridad: Alta** (el punto 1 es el hallazgo más grave de toda la auditoría)

---

## T06 — Auditoría / bitácora (anexo obligatorio de Trabajo de Diploma)

> **ACTUALIZACIÓN 2026-07-04:** implementado (diseño híbrido triggers + bitácora server-side + pantalla `/admin/auditoria`). Ver changelog de `CLAUDE.md` y `supabase/migration_auditoria_t06.sql`. El estado ❌ de abajo es la foto del momento de la auditoría. Pendiente: redactar el anexo.

**Estado: ❌ No existe** *(al momento de la auditoría)*
**Evidencia:** las tablas `gu_auditoria` (schema.sql:198-208) y `gu_audit_log` (schema.sql:211-222, con JSONB `datos_anteriores`/`datos_nuevos` e `ip_address`) existen en la DB, pero **cero referencias en `src/`** — ninguna operación escribe en ellas, nada las lee.
**Hallazgo:** no hay bitácora de operaciones, ni historial de cambios de ninguna entidad (solo `updated_at` = último estado, sin valores previos), ni registro de login/logout, ni pantalla/endpoint de consulta para el admin. Además, el anexo "Auditoría" no figura entre los redactados (13.1–13.8 no lo incluyen).
**Prioridad: ALTA — probablemente el gap #1 de la materia** (la infraestructura de tablas ya está, falta todo el resto)

---

## T07 — Resguardo y restauración (anexo obligatorio de Trabajo de Diploma)

**Estado: ❌ No existe como política instrumentada ni documentada**
**Evidencia:** grep `backup|resguardo|restaur` en `docs/`: solo una mención trivial en `MODULO_FACTURAS.md:200`. No hay anexo de Resguardo redactado (no está en 13.1–13.8). Infraestructura: **plan Free de Supabase, que no incluye backups automáticos programados** — el mecanismo disponible es export/download manual (o script propio con `pg_dump`).
**Hallazgo:** punto de reencuadre cloud (la guía asume SQL Server on-premise), pero el reencuadre **también está sin hacer**: falta definir frecuencia/medio/responsable/verificación y escribir los dos instructivos (resguardo + restauración). Nota a favor: la restauración "de facto" ya se ejercitó al reconstruir la DB desde `schema.sql`+migraciones versionadas (sesión 2026-07-02) — eso es material directo para el instructivo de restauración.
**Prioridad: Alta**

---

## A02 — Reportes / indicadores (≥2 con cruce de datos, ≥1 con gráfico)

**Estado: ⚠️ Cumple parcialmente**
**Evidencia:**
- Indicadores con cruce real de datos: ✅ hay más de 2 — `use-reportes.ts:31-150` calcula órdenes por estado, top 5 proveedores por monto (cruza `gu_ordenesdecompra`×`gu_proveedores`) y órdenes por mes (últimos 6 meses); `use-dashboard.ts:38-155` calcula pendientes/aprobadas/vencidas, monto total pagado y actividad reciente cruzando 3 endpoints. Se renderizan en `reportes-dashboard.tsx:22` y `dashboard-overview.tsx:56`.
- Gráfico: ❌ — recharts está instalado y el wrapper shadcn existe (`views/ui/chart.tsx:4`) pero **ningún componente lo usa**. Los `BarChart3` que aparecen en las vistas son **íconos de lucide**, no gráficos (`reportes-dashboard.tsx:7`). Cero gráficos renderizados en toda la app.
- El módulo "reportes guardados" (`ReporteController`) es mock con TODOs (`reporte.controller.ts:11-212`).

**Hallazgo:** la mitad "indicadores" está cumplida con datos reales; la mitad "gráfico" no existe (aunque la librería y los datos ya están — es la brecha más barata de cerrar de todo el informe).
**Prioridad: Media** (esfuerzo bajo, requisito explícito)

---

## T08 — Dígitos verificadores de integridad

**Estado: ⚠️ Reencuadre pendiente de validación**
**Evidencia:** no hay checksums propios. Sí hay: integridad referencial completa (constraints `fk_*` en todas las relaciones de schema.sql), UNIQUEs (`numero_oc`, `numero_cert`, `numero_op`, `email`, factura+cert), enums tipados en Postgres, y un trigger de regla de negocio con lock (`check_certificacion_max_100`).
**Hallazgo:** el ítem fue redactado para archivos de BD de escritorio. Pregunta abierta para el profesor: si las garantías de PostgreSQL gestionado (constraints + FKs + triggers + transaccionalidad) cumplen el espíritu de T08 o se espera un mecanismo de checksum explícito.
**Prioridad: Baja** (pero resolver la pregunta antes de la entrega)

---

## T09 — Pruebas de software

**Estado: ❌ No existe ningún test automatizado**
**Evidencia:** `package.json` no tiene script de test ni dependencia de testing (jest/vitest/playwright ausentes); glob `**/*.{test,spec}.*`: cero archivos.
**Hallazgo:** los 44 casos del anexo 13.5 son **solo documentación** — el requisito pide ejecutarlos y comparar obtenido vs. esperado, y exige mínimo 1 prueba unitaria caja blanca + 1 de validación caja negra. Discrepancia crítica documentación↔realidad.
**Prioridad: Alta**

---

## Base de datos (3FN + integridad + coherencia DER)

**Estado: ✅ en lo estructural / ⚠️ en coherencia documental**
**Evidencia:**
- FKs reales declaradas en todas las relaciones (schema.sql), PKs `BIGINT IDENTITY`, enums tipados, UNIQUE donde corresponde. Normalización razonable a 3FN. Observaciones menores: `caja` es texto libre en `gu_lineasdeordenesdepagocaja:192` (sin tabla catálogo — riesgo de inconsistencia de datos, no violación estricta); totales almacenados derivables (decisión común de performance).
- Coherencia docs↔real: ❌ `docs/DOCUMENTACION_PROYECTO.md:220-221` y `docs/AUTH_SETUP.md:72-73` siguen describiendo `perfiles_usuario`+UUID+`auth.users` (inexistentes). Además `schema.sql` **no es la foto completa** de la DB real: `gu_items` y `linea_oc_id` viven solo en migraciones.

**Prioridad: Media** (documental)

---

## Ítems menores

| Ítem | Estado | Evidencia / hallazgo |
|---|---|---|
| A01 Instalador → docs de despliegue | ⚠️ | No hay `.env.example` ni DEPLOY.md ni manual de deploy. Sí existen `seed.sql` y migraciones versionadas. Reencuadre obvio (deploy Vercel+Supabase) pero está sin redactar |
| A03 Serialización | ⚠️ | Export/import de configuración a JSON existe como ruta (`api/configuracion/exportar`) pero es MOCK (`ConfiguracionController` con TODOs). `gu_audit_log` tiene JSONB sin uso. Nada real hoy |
| D01 Manual de instalación | ❌ | No existe |
| D02 Ayuda en línea | ❌ | No existe (ni página de ayuda ni tooltips estructurados) |
| D03 Material de apoyo | ⚠️ | Anexos .docx e instructivo 13.8 fuera del repo — no verificables desde acá |

**Hallazgo transversal extra:** ESLint no está configurado (no hay `.eslintrc*` en la raíz; `next lint` pide setup interactivo) → el paso "Linting" del build no hace nada. El proyecto nunca fue linteado.

---

## Preguntas abiertas para Juan Andrés / el profesor Audoglio

1. **T04 (árbol de permisos / Composite):** el modelo real es un enum plano de 4 roles con funciones de chequeo (`shared/permissions.ts`). ¿Satisface el espíritu del requerimiento o se espera un árbol de permisos atómicos/compuestos con códigos por funcionalidad?
2. **T05 (Observer / multi-idioma):** el sistema es español-only por decisión de producto. ¿Está acordado como fuera de alcance, o hay que cubrir Observer con otro caso de uso real?
3. **T07 (resguardo en cloud):** plan Free de Supabase sin backups automáticos. ¿Alcanza con instrumentar un `pg_dump` programado propio + instructivos, o se espera otra cosa?
4. **T08 (dígitos verificadores):** ¿constraints+FKs+triggers de PostgreSQL gestionado cumplen el espíritu del ítem?
5. **T01 (4 capas):** el código hoy tiene 3 capas efectivas sin capa repositorio. ¿Se exige el refactor real (extraer repositorios de los `*Service`) o alcanza un reencuadre documental de la arquitectura actual? (Ojo: el refactor además habilitaría testear la lógica sin DB — sinergia con T09.)
6. **Anexos obligatorios:** Auditoría y Resguardo/Restauración no figuran entre los anexos ya redactados (13.1–13.8). Confirmar la lista oficial pendiente.

---

## Top 5 prioridades sugeridas (impacto en el 60% para aprobar)

1. **T06 Auditoría** — anexo obligatorio y hoy en cero funcional. Bitácora escribiendo en `gu_audit_log` (las tablas ya existen) desde las operaciones clave + login/logout + pantalla de consulta admin + anexo.
2. **Seguridad T02/T04** — cerrar el agujero RLS/anon-key (habilitar RLS o mover acceso a datos a server-side), middleware que verifique JWT, completar CRUD usuarios + reset/recuperar clave + conectar `changePassword`, eliminar superficies de debug.
3. **T09 Pruebas** — montar Vitest, implementar mínimo 1 caja blanca + 1 caja negra, y automatizar un subconjunto de los 44 casos documentados.
4. **T07 Resguardo** — instrumentar backup real (script `pg_dump` programado) + instructivos de resguardo/restauración + anexo.
5. **A02 gráfico + patrones GoF** — 1-2 gráficos recharts en el dashboard (data ya disponible, esfuerzo mínimo) y cerrar la tríada GoF con implementaciones genuinas (Singleton real para el cliente Supabase, Strategy u Observer donde aporte, documentar Facade existente).

*(Ningún arreglo fue ejecutado en esta sesión, conforme al modo auditoría.)*
