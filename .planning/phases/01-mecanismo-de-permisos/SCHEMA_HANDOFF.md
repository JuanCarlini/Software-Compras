# SCHEMA HANDOFF — RBAC Fase 1 (para la sesión con MCP de Supabase)

> El código NO toca Supabase (regla dura del proyecto). Esta es la precondición externa
> (Task 1 del plan): aplicala en la sesión con el MCP sobre el proyecto **"Gestion Uno v2"**
> (`ahhpzfoausrpfkumtzzx`). Confirmá siempre antes de aplicar. Cuando esté listo, avisá
> "schema aplicado" para desbloquear la Task 4 (`requirePermission` + repo I/O).

## 1. DDL — columna de permisos por rol

```sql
ALTER TABLE gu_roles ADD COLUMN permisos text[] NOT NULL DEFAULT '{}';
```

## 2. Seed de los 4 roles del sistema (replica la autorización ACTUAL 1:1)

Las claves son los **20 pares válidos** del catálogo en código
(`src/shared/permissions-catalog.ts`): los 4 módulos de workflow (ordenes_compra,
certificaciones, facturas, ordenes_pago) con `ver/crear/aprobar/borrar`; proveedores e
items con `ver/crear`.

```sql
-- admin: acceso por SHORT-CIRCUIT en requirePermission (tienePermiso). Array vacío A PROPÓSITO:
-- una sola fuente de verdad, sin duplicado stale-able. NO sembrar los 20 pares.
UPDATE gu_roles SET permisos = '{}' WHERE nombre = 'admin';

-- supervisor: los 20 pares (= ROLES_ESCRITURA + ROLES_APROBACION + ROLES_DESTRUCTIVO de hoy).
UPDATE gu_roles SET permisos = ARRAY[
  'ordenes_compra:ver','ordenes_compra:crear','ordenes_compra:aprobar','ordenes_compra:borrar',
  'certificaciones:ver','certificaciones:crear','certificaciones:aprobar','certificaciones:borrar',
  'facturas:ver','facturas:crear','facturas:aprobar','facturas:borrar',
  'ordenes_pago:ver','ordenes_pago:crear','ordenes_pago:aprobar','ordenes_pago:borrar',
  'proveedores:ver','proveedores:crear',
  'items:ver','items:crear'
] WHERE nombre = 'supervisor';

-- usuario: ver + crear en los 6 módulos (= ROLES_ESCRITURA, sin aprobar/borrar). 12 pares.
UPDATE gu_roles SET permisos = ARRAY[
  'ordenes_compra:ver','ordenes_compra:crear',
  'certificaciones:ver','certificaciones:crear',
  'facturas:ver','facturas:crear',
  'ordenes_pago:ver','ordenes_pago:crear',
  'proveedores:ver','proveedores:crear',
  'items:ver','items:crear'
] WHERE nombre = 'usuario';

-- readonly: solo ver en los 6 módulos. 6 pares.
UPDATE gu_roles SET permisos = ARRAY[
  'ordenes_compra:ver',
  'certificaciones:ver',
  'facturas:ver',
  'ordenes_pago:ver',
  'proveedores:ver',
  'items:ver'
] WHERE nombre = 'readonly';
```

## 3. Regenerar tipos

Correr `generate_typescript_types` y sobrescribir `src/lib/supabase/database.types.ts`.
Verificar que `gu_roles` (Row/Insert/Update) ahora incluya `permisos: string[]`.

## 4. Verificación (reportar de vuelta)

```sql
SELECT nombre, permisos FROM gu_roles ORDER BY nombre;
```
Esperado:
- `admin` → `{}`
- `supervisor` → 20 claves
- `usuario` → 12 claves
- `readonly` → 6 claves

Y `database.types.ts` contiene `permisos: string[]` en `gu_roles`.

> Nota: no se rompe nada del acceso actual — en Fase 1 **ninguna ruta** cambia de enforcement
> todavía (siguen con `requireRole`). El seed solo deja la DB lista para cuando la Fase 2
> cablee `requirePermission` en `ordenes_compra`.
