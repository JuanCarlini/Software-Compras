import { CertificacionService } from "@/controllers/certificacion.controller"
import { CambiarEstadoCertificacionSchema } from "@/shared/validation/certificacion-validation"
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
 * PATCH /api/certificaciones/[id]/estado
 *   409 transición inexistente · 422 trigger (regla del 100%, OC no aprobada) · 403 rol insuficiente
 */
export const PATCH = estadoRoute({
  schema: CambiarEstadoCertificacionSchema,
  autorizar: (estado: EstadoAprobacion) => requirePermission("certificaciones", accionRequerida(estado)),
  cambiarEstado: (id, estado) => CertificacionService.cambiarEstado(id, estado),
  tabla: "gu_certificaciones",
  accion: (estado) => ACCION[estado],
  detalle: (cert, estado) => `Certificación ${cert.numero_cert}: ${estado}`,
  contexto: "PATCH /api/certificaciones/[id]/estado",
})
