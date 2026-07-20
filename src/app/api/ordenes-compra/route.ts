import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { CreateOrdenCompraSchema } from "@/shared/orden-compra-validation"
import { AuditService } from "@/lib/audit/audit.service"
import { requirePermission } from "@/shared/permissions-server"
import { handleRouteError } from "@/shared/handle-route-error"

// GET /api/ordenes-compra - Lista con el rollup de certificación (leído de v_oc_rollup).
// Gateado por permiso: 'ordenes_compra:ver' (los 4 roles del sistema lo tienen por el seed).
export async function GET() {
  try {
    const { error: authError } = await requirePermission("ordenes_compra", "ver")
    if (authError) return authError

    return NextResponse.json(await OrdenCompraService.getAll())
  } catch (error) {
    return handleRouteError(error, "GET /api/ordenes-compra")
  }
}

// POST /api/ordenes-compra - Crear nueva orden (nace en borrador, la DB le pone el número)
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requirePermission("ordenes_compra", "crear")
    if (authError) return authError

    const validatedData = CreateOrdenCompraSchema.parse(await request.json())
    const nuevaOrden = await OrdenCompraService.create(validatedData)

    await AuditService.registrarDesdeRequest({
      tabla: "gu_ordenesdecompra",
      registroId: nuevaOrden.id,
      accion: "crear",
      detalle: `Orden de compra ${nuevaOrden.numero_oc} creada`,
    })

    return NextResponse.json(nuevaOrden, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/ordenes-compra")
  }
}
