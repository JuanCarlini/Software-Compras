# Rediseño del circuito de compras — CCIP simplificado (2026-07-07)

> Diseño validado con Juan Andrés (peloteado paso a paso) y con las capturas de su ERP real (Power Apps "Compras/Certificaciones/Pagos App", en `capturas/`). Fuente de verdad del rediseño. Enfoque: **evolucionar** el schema (mismo circuito OC→CE→FACT→OP), **limpiar los datos demo y rearmar las tablas del circuito** en la misma DB "Gestion Uno v2" (`ahhpzfoausrpfkumtzzx`). Se conservan auth/roles/usuarios, auditoría (T06), proyectos y proveedores.

## Dominio
Construcción. Circuito `Orden de Compra (OC) → Certificación (CE) → Factura (FACT) → Orden de Pago (OP)`. **Una sola moneda por circuito** (se fija en la OC y baja igual a CE/FACT/OP; sin tipo de cambio). **Sin** anticipos, fondo de reparo ni percepciones (decisión de simplificación).

## Entidades y relaciones
- **Item (catálogo)** ↔ **Proveedor**: N:M con **precio por proveedor** (`gu_item_proveedor_precio`). El item es agnóstico al proveedor (código, nombre, unidad, categoría); el precio vive en la puente. La lista de precios **se arma sola**: al cargar una línea de OC, si el item no tiene precio para ese proveedor, se escribe ahí y queda guardado.
- **OC** de 1 proveedor → **líneas LOC**; cada LOC elige un **item** del catálogo (cantidad, unidad, precio del proveedor, IVA por línea).
- **CE** cuelga de **UNA** OC; **líneas LCE → LOC** (referencian la línea de OC) con **avance en unidades** (de ahí se derivan avance $ y %). Tope 100% acumulado por LOC.
- **FACT**: **líneas LFACT** (detalle del comprobante del proveedor) **+** imputación **N:M a certificaciones** (`gu_facturas_certificaciones` con `monto_asignado`). Regla: **Σ monto_asignado ≤ Σ líneas de factura**.
- **OP**: paga **N facturas** (`gu_lineasdeordenesdepago`) y reparte en **N cajas** (`gu_lineasdeordenesdepagocaja` → `gu_cajas`), **todas de la misma moneda**. Regla: **Σ cajas = total a pagar**.

## Numeración jerárquica
`OC-N` → LOC `OC-N.n` → CE `CE-N.s` (secuencia por OC) → LCE `CE-N.s.x`. `FACT-N`, `OP-N`.

## Máquinas de estado (todas nacen en `borrador`; el estado no se elige)
- **OC**: borrador →[mandar a aprobar: **≥1 línea**]→ esperando_aprobacion →[aprobar]→ **aprobado** (habilita certificar). rechazar→borrador · anular.
- **CE**: borrador (elegís OC + línea/s + avance; **proveedor view-only heredado de la OC**) →[solicitar aprobación: **avance ≤100%**]→ esperando_aprobacion →[aprobar]→ **aprobado** (habilita facturar). Requiere OC aprobada. rechazar/anular.
- **FACT**: borrador (LFACT + imputación a certs) →[finalizar: **Σimput ≤ ΣLFACT**, sin aprobación]→ **finalizado** (habilita pagar). Requiere certs aprobadas. anular.
- **OP**: borrador (proveedor + facturas + cajas) →[solicitar aprobación: **Σcajas = total facturado a pagar**]→ esperando_aprobacion →[aprobar]→ aprobado →[pagar]→ **pagado**. Requiere facturas finalizadas. rechazar/anular.

Reglas duras (≥1 línea, avance ≤100% por unidades, Σimput≤ΣLFACT, Σcajas=total) → **triggers en la DB** (único punto no bypasseable) + pre-chequeo en el service (422 con mensaje en español).

## Rollups (Sin / Parcial / Total) — calculados, solo con docs aprobados/finalizados
- **LOC**: `estado_certificacion` = sin (0) / parcial (0<Σavance<cantidad) / total (=cantidad); `unidades_pendientes_certificar`, `monto_pendiente_certificar`.
- **OC**: rollup de sus LOC (`estado_certificacion`, `monto_pendiente_certificar`); `estado_factura` (imputación de facturas finalizadas a sus certs); `estado_pago` (OPs pagadas).
- **CE**: `estado_facturacion`, `estado_pago`. **FACT**: `estado_pago`.
Implementados como triggers que recalculan al cambiar estados/montos.

## Esquema concreto (tablas `gu_*`)
**Catálogo**
- `gu_proveedores` (existe): + `condicion_iva` opcional.
- `gu_items`: **+ `codigo` UNIQUE**, − `precio_sugerido`. Mantiene nombre/descripcion/unidad_medida/categoria/is_active.
- `gu_item_proveedor_precio` (NUEVA): item_id, proveedor_id, precio, UNIQUE(item_id, proveedor_id).
- `gu_cajas` (NUEVA): nombre, tipo (banco/efectivo/cheque/transferencia), entidad, moneda, is_active. CRUD admin.

**Documentos**
- `gu_ordenesdecompra`: numero_oc, proveedor_id, proyecto_id (opcional), moneda, tarea, fecha, totales, estado (enum aprobación), rollups (`estado_certificacion`, `estado_factura`, `estado_pago`, `monto_pendiente_certificar`), created_by.
- `gu_lineasdeordenesdecompra`: numero_loc, **item_id requerido**, cantidad, unidad, precio_unitario_neto, iva_porcentaje, totales, rollups por línea.
- `gu_certificaciones`: **+ orden_compra_id FK (cuelga de 1 OC)**, numero_cert `CE-N.s`, fecha_devengado, estado, rollups; `proyecto_id` deja de ser NOT NULL (deriva de OC).
- `gu_lineasdecertificacion`: numero_lce, **linea_oc_id requerido**, `avance_unidades` (input), `avance_monto`/`avance_porcentaje` (derivados), iva. Trigger 100% por unidades.
- `gu_facturas`: numero_factura interno `FACT-N` + numero_comprobante (proveedor) + punto_venta, fecha_emision, moneda, totales, total_facturado, estado (borrador/finalizado/anulado). Sin CAE/percepciones.
- `gu_lineasdefactura`: descripcion, cantidad, precio_unitario, iva_porcentaje, totales.
- `gu_facturas_certificaciones`: **+ monto_asignado**, UNIQUE(factura_id, certificacion_id). Trigger Σ≤total.
- `gu_ordenesdepago`: numero_op, proveedor_id, moneda, total_a_pagar, estado (borrador/esperando_aprobacion/aprobado/pagado/rechazado/anulado), fecha.
- `gu_lineasdeordenesdepago`: orden_pago_id, factura_id (solo finalizadas), monto.
- `gu_lineasdeordenesdepagocaja`: **+ caja_id FK a gu_cajas** (en vez de texto libre), monto. Trigger misma moneda + Σ=total.

**Enums nuevos**: estados con `esperando_aprobacion` (OC/CE/OP); FACT `borrador/finalizado/anulado`; OP + `pagado`; `rollup_estado` (sin/parcial/total); `caja_tipo`.

## Reparto de trabajo
- **Supabase (schema, migraciones, triggers, RLS, seed, tipos TS) = sesión de Juan Andrés** (tiene el MCP). El agente de backend **no** tiene acceso a Supabase.
- **Agente de backend = capa de app** (repos, services, API de transiciones, Zod, requireRole, AuditService, convención PK number + `parseId`, tests) contra el schema + tipos provistos.
- **Agente de frontend = UI** (wizards de transición, listas homogéneas, OC con selector de item, cert, imputación de factura, split de cajas en OP). Separado; se le da el contrato.

## Convención de PK
`number` de punta a punta (DB `BIGINT`); conversión `string→number` en la frontera con `parseId(param)` (valida entero positivo, 400 si no). Sin `id: string` ni casts dispersos.

## E2E de aceptación
Crear OC (borrador→aprobado) → certificar 60/100 (parcial→aprobado) → factura imputada (finalizado) → OP con 2 cajas que matchean el total (esperando→aprobado→pagado), verificando rollups Sin/Parcial/Total en cada paso.
