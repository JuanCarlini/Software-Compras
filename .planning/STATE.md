# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-20)

**Core value:** RBAC real — un rol puede tener permisos propios (`modulo:accion`), editables desde la UI, que gobiernan el acceso real (hoy están hardcodeados a los 4 nombres de rol).
**Current focus:** Phase 1 — Mecanismo de permisos

## Current Position

Phase: 1 of 2 (Mecanismo de permisos)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-07-20 — Roadmap y STATE creados desde el spec aprobado

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: — min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Milestone]: Granularidad `modulo:accion` (~20 permisos); catálogo en código, asignación en `gu_roles.permisos text[]`.
- [Milestone]: Enforcement por `requirePermission(modulo, accion)` resuelto per-request; admin short-circuit.
- [Milestone]: Vertical slice en `ordenes_compra` primero; rollout a otros módulos es mecánico y va al milestone siguiente.
- [Milestone]: Revierte la decisión T04 (2026-07-04) — actualizar el anexo T04 en sesión de tesis (fuera de alcance).

### Pending Todos

None yet.

### Blockers/Concerns

- **Dependencia externa dura (Phase 1):** el cambio de schema (`ALTER TABLE gu_roles ADD COLUMN permisos text[]` + seed + regenerar `database.types.ts`) lo aplica una sesión separada con el MCP de Supabase (el código no toca Supabase). La línea de código entrega el DDL + los sets de seed como insumo. Phase 1 no se verifica end-to-end hasta que esa sesión aplique el schema.

## Deferred Items

Items acknowledged and carried forward:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Rollout | PERM-R1: `requirePermission` en los otros 5 módulos (~35 rutas) | Deferred a milestone siguiente | 2026-07-20 |
| Limpieza | PERM-R2: retirar `ROLES_*` y `stringToUserRole` cuando no queden consumidores | Deferred a milestone siguiente | 2026-07-20 |

## Session Continuity

Last session: 2026-07-20
Stopped at: Roadmap de 2 fases creado, cobertura 10/10 requirements validada
Resume file: None
