import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { CambiarEstadoOCSchema } from "@/shared/orden-compra-validation"
import { requirePermission } from "@/shared/permissions-server"
import { accionRequerida } from "@/shared/transiciones"
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
 * PATCH /api/ordenes-compra/[id]/estado — transición de estado.
 *
 *   200 la OC actualizada
 *   403 el rol no alcanza para este destino
 *   409 la transición no existe en el grafo (p.ej. borrador -> aprobado)
 *   422 un trigger la rechazó (p.ej. "La OC debe tener al menos una línea...")
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id)
    const { estado } = CambiarEstadoOCSchema.parse(await request.json())

    // El permiso depende del DESTINO: mandar a aprobar es 'crear'; aprobar/rechazar/anular, 'aprobar'.
    const { error: authError, user } = await requirePermission("ordenes_compra", accionRequerida(estado))
    if (authError) return authError

    const oc = await OrdenCompraService.cambiarEstado(id, estado)

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_ordenesdecompra",
      registroId: id,
      accion: ACCION[estado],
      detalle: `Orden de compra ${oc.numero_oc}: ${estado}`,
    })

    return NextResponse.json(oc)
  } catch (error) {
    return handleRouteError(error, "PATCH /api/ordenes-compra/[id]/estado")
  }
}
