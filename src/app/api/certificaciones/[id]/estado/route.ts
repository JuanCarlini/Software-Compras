import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"
import { CambiarEstadoCertificacionSchema } from "@/shared/certificacion-validation"
import { requireRole } from "@/shared/permissions-server"
import { rolRequerido } from "@/shared/transiciones"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { AuditService } from "@/lib/audit/audit.service"
import type { EstadoAprobacion } from "@/models"

const ACCION: Record<EstadoAprobacion, "aprobar" | "rechazar" | "anular" | "actualizar"> = {
  aprobado: "aprobar",
  rechazado: "rechazar",
  anulado: "anular",
  en_aprobacion: "actualizar",
  borrador: "actualizar",
}

/**
 * PATCH /api/certificaciones/[id]/estado
 *   409 la transición no existe (p.ej. borrador -> aprobado)
 *   422 un trigger la rechazó (regla del 100%, OC no aprobada)
 *   403 el rol no alcanza para este destino
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id)
    const { estado } = CambiarEstadoCertificacionSchema.parse(await request.json())

    const { error: authError, user } = await requireRole(rolRequerido(estado))
    if (authError) return authError

    const cert = await CertificacionService.cambiarEstado(id, estado)

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_certificaciones",
      registroId: id,
      accion: ACCION[estado],
      detalle: `Certificación ${cert.numero_cert}: ${estado}`,
    })

    return NextResponse.json(cert)
  } catch (error) {
    return handleRouteError(error, "PATCH /api/certificaciones/[id]/estado")
  }
}
