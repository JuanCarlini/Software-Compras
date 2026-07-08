# Schema del circuito CCIP — contrato para la capa de app (2026-07-07)

> **Ya aplicado y verificado E2E** en Supabase "Gestion Uno v2" (`ahhpzfoausrpfkumtzzx`). Este doc es el **contrato** que la capa de app (repos/services/API) debe respetar. El "por qué" está en `DISENO_CIRCUITO_CCIP_2026-07-07.md`; los tipos exactos en `src/lib/supabase/database.types.ts`. **El agente de backend NO toca Supabase**: si algo del schema/trigger tiene que cambiar, se le pide a Juan Andrés (él tiene el MCP). Codeás contra esto.

Circuito: `OC → Certificación (CE) → Factura (FACT) → Orden de Pago (OP)`. PK = `BIGINT` (número) en todas. Una sola moneda por circuito (se fija en la OC, baja a CE/FACT/OP). Sin anticipos/fondo de reparo/percepciones.

---

## Regla de oro: qué llena la DB vs qué manda la app

**NUNCA envíes estas columnas en INSERT/UPDATE (las pone la DB por trigger):**
- `id` (identity), `numero_oc`, `numero_loc`, `numero_cert`, `numero_lce`, `numero_factura`, `numero_op` → generados `BEFORE INSERT`.
- `avance_monto`, `avance_porcentaje`, `numero_lce` en LCE → **derivados** de `avance_unidades` + la LOC vinculada (trigger `fn_lce_derive`).
- `created_at`, `updated_at` → `updated_at` lo refresca `fn_set_updated_at` en cada UPDATE.

**La app SÍ calcula y escribe (no hay trigger que los mantenga):**
- **Totales de línea**: LOC y LFACT `total_neto`/`total_con_iva` = `cantidad × precio (+ IVA)`.
- **Totales de cabecera**: OC `total_neto/total_iva/total_con_iva`; FACT `total_neto/total_iva/total_con_iva` + `total_facturado`; OP `total_a_pagar`. **Al cambiar líneas, la app recalcula y hace UPDATE de la cabecera.** (LCE es la excepción: sus totales los deriva el trigger.)

**`estado`**: se fija server-side en el create al inicial (nunca del body). Las transiciones son UPDATE de `estado` (gateadas por trigger). Ver máquinas de estado abajo.

---

## Enums (valores exactos)
- `estado_aprobacion` = `borrador | en_aprobacion | aprobado | rechazado | anulado` → **OC y CE**.
- `estado_factura` = `borrador | finalizado | anulado` → **FACT** (sin aprobación intermedia).
- `estado_op` = `borrador | en_aprobacion | aprobado | pagado | rechazado | anulado` → **OP**.
- `estado_rollup` = `sin | parcial | total` → columnas calculadas de las vistas.
- `caja_tipo` = `banco | efectivo | cheque | transferencia`.
- `moneda_enum` = `ARS | USD | EUR` (default `ARS`).
- (existentes) `estado_activo_inactivo`, `proyecto_estado`, `audit_accion`.

> Ojo: el enum de aprobación usa **`en_aprobacion`** (no "esperando_aprobacion"). El front lo puede etiquetar "Esperando aprobación".

---

## Tablas

### Catálogo
- **`gu_items`**: `codigo` (UNIQUE, NOT NULL), `nombre`, `descripcion`, `unidad_medida`, `categoria`, `is_active`, `created_by`. (Se fue `precio_sugerido`: el precio vive en la puente.)
- **`gu_item_proveedor_precio`** (N:M item↔proveedor): `item_id`, `proveedor_id`, `precio`, `UNIQUE(item_id, proveedor_id)`. **Alta al vuelo**: al cargar una LOC, si no existe precio para (item, proveedor de la OC), insertarlo acá; si existe, es el precio heredado.
- **`gu_cajas`**: `nombre`, `tipo` (`caja_tipo`), `entidad` (texto), `moneda`, `is_active`. CRUD admin.
- **`gu_proveedores`**: +`condicion_iva` (opcional). `estado` sigue `activo/inactivo`.

### Documentos
- **`gu_ordenesdecompra`**: `proveedor_id` (req), `proyecto_id` (opcional), `moneda`, `tarea`, `fecha_oc`, totales, `estado` (`estado_aprobacion`, default `borrador`), `created_by`.
- **`gu_lineasdeordenesdecompra`** (LOC): `orden_compra_id`, `item_id` (req), `descripcion`, `cantidad` (CHECK>0), `unidad_medida`, `precio_unitario_neto`, `iva_porcentaje`, totales. `numero_loc` = `numero_oc || '.' || n`.
- **`gu_certificaciones`** (CE): `orden_compra_id` (req, cuelga de 1 OC), `proveedor_id` (lo rellena el trigger desde la OC si va NULL), `fecha_devengado`, totales, `estado` (`estado_aprobacion`). `numero_cert` = `CE-<Ndelaoc>.s`.
- **`gu_lineasdecertificacion`** (LCE): `certificacion_id`, `linea_oc_id` (req), **`avance_unidades`** (CHECK>0, el único input). La DB deriva `avance_monto`, `avance_porcentaje`, `iva_porcentaje`, `numero_lce`.
- **`gu_facturas`** (FACT): `proveedor_id`, `numero_comprobante` (del proveedor) + `punto_venta`, `fecha_emision`, `moneda`, totales, `total_facturado`, `estado` (`estado_factura`). `numero_factura` interno = `FACT-N`.
- **`gu_lineasdefactura`** (LFACT): `factura_id`, `descripcion`, `cantidad`, `precio_unitario`, `iva_porcentaje`, totales.
- **`gu_facturas_certificaciones`** (imputación N:M): `factura_id`, `certificacion_id`, **`monto_asignado`**, `UNIQUE(factura_id, certificacion_id)`.
- **`gu_ordenesdepago`** (OP): `proveedor_id`, `moneda`, `total_a_pagar`, `fecha_op`, `estado` (`estado_op`). `numero_op` = `OP-N`.
- **`gu_lineasdeordenesdepago`** (LOP facturas): `orden_pago_id`, `factura_id` (solo `finalizado`), `monto`, `UNIQUE(orden_pago_id, factura_id)`.
- **`gu_lineasdeordenesdepagocaja`** (LOPcaja): `orden_pago_id`, `caja_id` (FK a `gu_cajas`), `monto`.

---

## Máquinas de estado + gates (triggers `BEFORE UPDATE`)

Todo nace en `borrador`. Las transiciones son UPDATE de `estado`. Los gates son triggers → **pre-validá en el service y traducí el error a 422** con el mismo mensaje.

- **OC**: `borrador → en_aprobacion` (gate `fn_oc_gate`: ≥1 línea) → `aprobado` (habilita certificar) · `rechazado`→`borrador` · `anulado`.
- **CE**: requiere **OC aprobada**. `borrador → en_aprobacion` (gate `fn_check_avance_100`, ver abajo) → `aprobado` (habilita facturar) · `rechazado`/`anulado`.
- **FACT**: requiere **certs aprobadas**. `borrador → finalizado` (sin aprobación) → habilita pagar · `anulado`. La regla de imputación se chequea al insertar en la puente (ver abajo).
- **OP**: requiere **facturas finalizadas**. `borrador → en_aprobacion` (gate `fn_op_gate`) → `aprobado` → `pagado` · `rechazado`/`anulado`.

### Mensajes exactos de los triggers (mapear a **422**)
| Trigger | Cuándo salta | Mensaje (`%` = valores) |
|---|---|---|
| `fn_check_avance_100` | INSERT/UPDATE de LCE | `No se puede certificar más del 100% de la línea de OC: cantidad %, ya certificado %, se intentó %` (y `La línea de OC % no existe`) |
| `fn_check_imputacion` | INSERT/UPDATE de `gu_facturas_certificaciones` | `Solo se pueden imputar certificaciones aprobadas` · `La suma imputada a certificaciones (%) no puede superar el total de líneas de factura (%)` |
| `fn_oc_gate` | OC `borrador→en_aprobacion` | `La OC debe tener al menos una línea para mandarse a aprobar` |
| `fn_op_gate` | OP `borrador→en_aprobacion` | `Todas las cajas deben ser de la moneda de la OP (%)` · `El total de las cajas (%) debe igualar el total a pagar (%)` · `El total de las facturas (%) debe igualar el total a pagar (%)` |

`fn_check_avance_100` acumula por **unidades** por LOC (excluye CE `anulado`/`rechazado`, usa `FOR UPDATE`). La imputación exige cert `aprobado` **y** Σ`monto_asignado` de la factura ≤ Σ`total_con_iva` de sus LFACT.

---

## Rollups = VIEWS (leer, no calcular). `security_invoker=true`.
- **`v_loc_rollup`** (por LOC): `linea_oc_id`, `orden_compra_id`, `cantidad`, `unidades_certificadas`, `unidades_pendientes`, `monto_pendiente`, `estado_certificacion` (`sin/parcial/total`). Cuenta solo CE **aprobadas**.
- **`v_oc_rollup`** (por OC): `orden_compra_id`, `monto_pendiente_certificar`, `estado_certificacion` (rollup de sus LOC).
- **`v_cert_rollup`** (por CE): `certificacion_id`, `total_con_iva`, `monto_facturado`, `estado_facturacion`. Cuenta solo facturas **finalizadas** (su `monto_asignado`).
- **`v_factura_rollup`** (por FACT): `factura_id`, `total_facturado`, `monto_pagado`, `estado_pago`. Cuenta solo OPs **pagadas**.

En listas/detalles, hacer join a la vista para el chip de estado en vez de recalcular en JS.

---

## Auditoría (T06, intacta)
`fn_audit_log` sigue como trigger `AFTER I/U/D` en OC/CE/FACT/OP → `gu_audit_log` (valores ant/nue). El `AuditService` sigue escribiendo la bitácora a `gu_auditoria` desde los services. No cambia.

## Seguridad (intacta)
RLS **deny-anon** en las 13 tablas nuevas + las de auth. Acceso solo por `service_role` (server-only). `REVOKE EXECUTE` en todas las funciones nuevas (no RPC-invocables). El advisor solo tira `INFO rls_enabled_no_policy` (deny intencional) + 1 `WARN` viejo de `search_path` en `update_gu_items_updated_at` (pre-existente).

## Seed presente (para el E2E y la demo)
- Items: `COD-0001` (cemento, bolsa), `COD-0002` (hierro, unidad), `COD-0003` (retroexcavadora, hora).
- Precios: proveedor 1 → 9500/18000/45000; proveedor 2 → 9200 (COD-0001).
- Cajas: "Cuenta corriente Galicia" (banco, ARS), "Caja efectivo oficina" (efectivo, ARS).
- **Circuito demo completo** ya cargado: `OC-00001` (aprobado) → `CE-00001.1` (aprobado, 60/100) → `FACT-00001` (finalizado) → `OP-00001` (pagado, 2 cajas). Sirve de referencia viva de shapes y rollups.
