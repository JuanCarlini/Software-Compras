import { FacturaService } from "@/controllers/factura.controller"
import { CambiarEstadoFacturaSchema } from "@/shared/factura-validation"
import { requirePermission } from "@/lib/auth/permissions-server"
import { accionRequerida } from "@/shared/transiciones"
import { estadoRoute } from "@/lib/route/estado-route"
import type { AccionAuditoria } from "@/lib/audit/audit.service"
import type { EstadoFactura } from "@/models"

const ACCION: Record<EstadoFactura, AccionAuditoria> = {
  finalizado: "actualizar",
  anulado: "anular",
  borrador: "actualizar",
}

/**
 * PATCH /api/facturas/[id]/estado
 *   borrador -> finalizado (habilita pagar; exige >=1 imputación) | anulado
 *   409 transición inexistente · 422 sin imputaciones · 403 permiso insuficiente
 *
 * FACT no tiene aprobación intermedia. accionRequerida mapea el destino al permiso:
 * finalizar -> 'facturas:crear'; anular -> 'facturas:aprobar' ('anulado' ∈ REQUIERE_APROBACION).
 */
export const PATCH = estadoRoute({
  schema: CambiarEstadoFacturaSchema,
  autorizar: (estado: EstadoFactura) => requirePermission("facturas", accionRequerida(estado)),
  cambiarEstado: (id, estado) => FacturaService.cambiarEstado(id, estado),
  tabla: "gu_facturas",
  accion: (estado) => ACCION[estado],
  detalle: (factura, estado) => `Factura ${factura.numero_factura}: ${estado}`,
  contexto: "PATCH /api/facturas/[id]/estado",
})
