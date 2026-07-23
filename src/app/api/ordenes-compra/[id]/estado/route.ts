import { OrdenCompraService } from "@/controllers"
import { CambiarEstadoOCSchema } from "@/shared/validation/orden-compra-validation"
import { requirePermission } from "@/lib/auth/permissions-server"
import { accionRequerida } from "@/controllers/transiciones"
import { estadoRoute } from "@/lib/route/estado-route"
import type { AccionAuditoria } from "@/lib/audit/audit.service"
import type { EstadoAprobacion } from "@/models"

const ACCION: Record<EstadoAprobacion, AccionAuditoria> = {
  aprobado: "aprobar",
  rechazado: "rechazar",
  anulado: "anular",
  en_aprobacion: "actualizar",
  borrador: "actualizar",
}

/**
 * PATCH /api/ordenes-compra/[id]/estado — transición de estado.
 *   200 la OC actualizada · 403 rol/permiso insuficiente para el destino
 *   409 transición inexistente en el grafo · 422 un trigger la rechazó
 *
 * El permiso depende del DESTINO: mandar a aprobar es 'crear'; aprobar/rechazar/anular, 'aprobar'.
 */
export const PATCH = estadoRoute({
  schema: CambiarEstadoOCSchema,
  autorizar: (estado: EstadoAprobacion) =>
    requirePermission("ordenes_compra", accionRequerida(estado)),
  cambiarEstado: (id, estado) => OrdenCompraService.cambiarEstado(id, estado),
  tabla: "gu_ordenesdecompra",
  accion: (estado) => ACCION[estado],
  detalle: (oc, estado) => `Orden de compra ${oc.numero_oc}: ${estado}`,
  contexto: "PATCH /api/ordenes-compra/[id]/estado",
})
