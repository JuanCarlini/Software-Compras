import { FacturaService } from "@/controllers/factura.controller"
import { CambiarEstadoFacturaSchema } from "@/shared/factura-validation"
import { requireRole } from "@/shared/permissions-server"
import { rolRequerido } from "@/shared/transiciones"
import { estadoRoute } from "@/shared/estado-route"
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
 *   409 transición inexistente · 422 sin imputaciones · 403 rol insuficiente
 *
 * FACT no tiene aprobación intermedia. Finalizar es de escritura; anular, supervisor+
 * (rolRequerido: 'anulado' ∈ REQUIERE_APROBACION, 'finalizado' no).
 */
export const PATCH = estadoRoute({
  schema: CambiarEstadoFacturaSchema,
  autorizar: (estado: EstadoFactura) => requireRole(rolRequerido(estado)),
  cambiarEstado: (id, estado) => FacturaService.cambiarEstado(id, estado),
  tabla: "gu_facturas",
  accion: (estado) => ACCION[estado],
  detalle: (factura, estado) => `Factura ${factura.numero_factura}: ${estado}`,
  contexto: "PATCH /api/facturas/[id]/estado",
})
