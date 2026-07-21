import { OrdenPagoService } from "@/controllers"
import { CambiarEstadoOPSchema } from "@/shared/orden-pago-validation"
import { requireRole } from "@/shared/permissions-server"
import { rolRequerido } from "@/shared/transiciones"
import { estadoRoute } from "@/shared/estado-route"
import type { AccionAuditoria } from "@/lib/audit/audit.service"
import type { EstadoOp } from "@/models"

const ACCION: Record<EstadoOp, AccionAuditoria> = {
  aprobado: "aprobar",
  rechazado: "rechazar",
  anulado: "anular",
  pagado: "actualizar",
  en_aprobacion: "actualizar",
  borrador: "actualizar",
}

/**
 * PATCH /api/ordenes-pago/[id]/estado
 *   borrador -> en_aprobacion (gate fn_op_gate: cajas misma moneda + Σcajas=Σfacturas=total)
 *   -> aprobado -> pagado. rechazado/anulado.
 *   409 transición inexistente · 422 gate del trigger · 403 rol insuficiente
 *
 * pagar/aprobar/rechazar/anular exigen supervisor+; mandar a aprobar, escritura.
 */
export const PATCH = estadoRoute({
  schema: CambiarEstadoOPSchema,
  autorizar: (estado: EstadoOp) => requireRole(rolRequerido(estado)),
  cambiarEstado: (id, estado) => OrdenPagoService.cambiarEstado(id, estado),
  tabla: "gu_ordenesdepago",
  accion: (estado) => ACCION[estado],
  detalle: (orden, estado) => `Orden de pago ${orden.numero_op}: ${estado}`,
  contexto: "PATCH /api/ordenes-pago/[id]/estado",
})
