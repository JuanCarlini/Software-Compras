import { NextResponse } from "next/server"
import { OrdenPagoService } from "@/controllers"
import { CreateOrdenPagoSchema } from "@/shared/orden-pago-validation"
import { requirePermission } from "@/shared/permissions-server"
import { handleRouteError } from "@/shared/handle-route-error"
import { createRoute } from "@/shared/crud-route"

// GET /api/ordenes-pago - Lista (con el nombre del proveedor aplanado)
export async function GET() {
  try {
    const { error: authError } = await requirePermission("ordenes_pago", "ver")
    if (authError) return authError
    return NextResponse.json(await OrdenPagoService.getAll())
  } catch (error) {
    return handleRouteError(error, "GET /api/ordenes-pago")
  }
}

// POST /api/ordenes-pago - Crear la OP (vacía: nace en borrador con total 0).
// Las facturas y las cajas se cargan con /[id]/facturas y /[id]/cajas.
export const POST = createRoute({
  autorizar: () => requirePermission("ordenes_pago", "crear"),
  schema: CreateOrdenPagoSchema,
  crear: (data) => OrdenPagoService.create(data),
  audit: {
    tabla: "gu_ordenesdepago",
    detalle: (o) => `Orden de pago ${o.numero_op ?? o.id} creada`,
  },
  contexto: "POST /api/ordenes-pago",
})
