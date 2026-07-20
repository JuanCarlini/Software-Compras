import { NextRequest, NextResponse } from "next/server"
import { OrdenPagoService } from "@/controllers"
import { CreateOrdenPagoSchema } from "@/shared/orden-pago-validation"
import { AuditService } from "@/lib/audit/audit.service"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { handleRouteError } from "@/shared/handle-route-error"

// GET /api/ordenes-pago - Lista (con el nombre del proveedor aplanado)
export async function GET() {
  try {
    return NextResponse.json(await OrdenPagoService.getAll())
  } catch (error) {
    return handleRouteError(error, "GET /api/ordenes-pago")
  }
}

// POST /api/ordenes-pago - Crear la OP (vacía: nace en borrador con total 0).
// Las facturas y las cajas se cargan con /[id]/facturas y /[id]/cajas.
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const validatedData = CreateOrdenPagoSchema.parse(await request.json())
    const nuevaOrden = await OrdenPagoService.create(validatedData)

    await AuditService.registrarDesdeRequest({
      tabla: "gu_ordenesdepago",
      registroId: nuevaOrden.id,
      accion: "crear",
      detalle: `Orden de pago ${nuevaOrden.numero_op ?? nuevaOrden.id} creada`,
    })

    return NextResponse.json(nuevaOrden, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/ordenes-pago")
  }
}
