import { NextRequest, NextResponse } from "next/server"
import { OrdenPagoService } from "@/controllers"
import { CambiarEstadoOPSchema } from "@/shared/orden-pago-validation"
import { requireRole } from "@/shared/permissions-server"
import { rolRequerido } from "@/shared/transiciones"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { AuditService, type AccionAuditoria } from "@/lib/audit/audit.service"
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
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id)
    const { estado } = CambiarEstadoOPSchema.parse(await request.json())

    // pagar/aprobar/rechazar/anular exigen supervisor+; mandar a aprobar, escritura.
    const { error: authError, user } = await requireRole(rolRequerido(estado))
    if (authError) return authError

    const orden = await OrdenPagoService.cambiarEstado(id, estado)

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_ordenesdepago",
      registroId: id,
      accion: ACCION[estado],
      detalle: `Orden de pago ${orden.numero_op}: ${estado}`,
    })

    return NextResponse.json(orden)
  } catch (error) {
    return handleRouteError(error, "PATCH /api/ordenes-pago/[id]/estado")
  }
}
