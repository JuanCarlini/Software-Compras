# Gestión Uno — Proyecto

## Qué es

ERP de **control de compras y pagos** para constructoras y desarrolladoras inmobiliarias.
Propósito dual: producción real + Trabajo de Diploma (Ing. en Sistemas, UAI Rosario).
Circuito central CCIP: `Orden de Compra → Certificación → Factura → Orden de Pago`.

**Stack:** Next.js 15 (App Router) · React 18 · TypeScript · Tailwind 3.4 + shadcn/Radix ·
Supabase (PostgreSQL, solo DB) · JWT custom (bcryptjs + jsonwebtoken, verificado con `jose`
en middleware) · vitest. Arquitectura de 4 capas: `repositories/` (único `.from()`) →
`controllers/` (*Service) → `models/` → `views/`+`app/`. Acceso a datos server-only con
`service_role`; RLS deny-anon en la DB. Memoria completa del proyecto en `CLAUDE.md`.

## Milestone actual

**Permisos personalizados por rol (RBAC real).** Hoy un rol es solo nombre + descripción;
los permisos están hardcodeados en código atados a los 4 nombres de rol del sistema. Meta:
que un rol pueda tener permisos propios (`modulo:accion`), editables desde la UI, que
gobiernen el acceso real. Spec aprobado: `docs/superpowers/specs/2026-07-20-roles-permisos-design.md`.

## Requirements

### Validated (ya existe en el codebase)

- ✓ Circuito CCIP completo OC→CE→FACT→OP con reglas duras en triggers Postgres — existing
- ✓ Auth JWT custom + middleware con firma + RLS deny-anon + acceso server-only — existing
- ✓ Autorización por rol en rutas mutantes (`requireRole`, grupos hardcodeados) — existing
- ✓ CRUD de usuarios y de roles (roles = solo nombre/descripción) — existing
- ✓ Auditoría (bitácora + control de cambios por triggers) — existing
- ✓ Suite de tests vitest (142) + build verde — existing

### Active (este milestone)

- [ ] Un rol puede tener un conjunto de permisos `modulo:accion` almacenado en la DB
- [ ] La autorización real chequea permisos del rol, no el nombre del rol hardcodeado
- [ ] Un admin puede asignar/quitar permisos a un rol desde una matriz de checkboxes
- [ ] Los 4 roles del sistema arrancan replicando el comportamiento actual (cero regresión)
- [ ] `admin` siempre tiene todos los permisos (anti auto-lockout)

### Out of Scope (por ahora)

- Migrar los 99 sitios de enforcement de una — se hace tras el vertical slice (mecánico)
- Sección admin (usuarios/roles/auditoría) en el modelo de permisos — sigue admin-only
- Permisos por recurso individual / fila / árbol jerárquico — YAGNI
- Tabla de catálogo de permisos en DB — el catálogo vive en código

## Key Decisions

| Decisión | Rationale | Outcome |
|----------|-----------|---------|
| Granularidad `modulo:accion` (~20 permisos) | RBAC real sin matriz gigante; mapea sobre los grupos actuales | — Pendiente |
| Catálogo en código, asignación en `gu_roles.permisos text[]` | El catálogo es estático (atado a rutas); asignación editable por rol | — Pendiente |
| Enforcement por `requirePermission(modulo,accion)`, resuelto per-request | Permisos frescos sin staleness de JWT; admin short-circuit | — Pendiente |
| Vertical slice en `ordenes_compra` primero | Prueba el mecanismo end-to-end con menor riesgo; rollout mecánico después | — Pendiente |
| Revierte la decisión T04 (2026-07-04) | El pedido explícito pide RBAC real; actualizar el anexo T04 en sesión de tesis | — Pendiente |

## Evolution

Este documento evoluciona en transiciones de fase y bordes de milestone.

---
*Last updated: 2026-07-20 after initialization (brownfield)*
