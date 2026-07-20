import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { CambiarEstadoFacturaSchema } from "@/shared/factura-validation"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA, ROLES_APROBACION } from "@/shared/permissions"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { AuditService } from "@/lib/audit/audit.service"

/**
 * PATCH /api/facturas/[id]/estado
 *   borrador -> finalizado (habilita pagar; exige >=1 imputación) | anulado
 *   409 transición inexistente · 422 sin imputaciones · 403 rol insuficiente
 *
 * FACT no tiene aprobación intermedia. Finalizar es de escritura; anular, supervisor+.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id)
    const { estado } = CambiarEstadoFacturaSchema.parse(await request.json())

    const roles = estado === "anulado" ? ROLES_APROBACION : ROLES_ESCRITURA
    const { error: authError, user } = await requireRole(roles)
    if (authError) return authError

    const factura = await FacturaService.cambiarEstado(id, estado)

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_facturas",
      registroId: id,
      accion: estado === "anulado" ? "anular" : "actualizar",
      detalle: `Factura ${factura.numero_factura}: ${estado}`,
    })

    return NextResponse.json(factura)
  } catch (error) {
    return handleRouteError(error, "PATCH /api/facturas/[id]/estado")
  }
}
