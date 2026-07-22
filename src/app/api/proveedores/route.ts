import { NextResponse } from "next/server"
import { ProveedorService } from "@/controllers"
import { requirePermission } from "@/shared/permissions-server"
import { CreateProveedorSchema } from "@/shared/proveedor-validation"
import { handleRouteError } from "@/shared/handle-route-error"
import { createRoute } from "@/shared/crud-route"

export async function GET() {
  try {
    const { error: authError } = await requirePermission("proveedores", "ver")
    if (authError) return authError
    const proveedores = await ProveedorService.getAll()
    return NextResponse.json(proveedores || [])
  } catch (error) {
    return handleRouteError(error, "GET /api/proveedores")
  }
}

export const POST = createRoute({
  autorizar: () => requirePermission("proveedores", "crear"),
  schema: CreateProveedorSchema, // S4: whitelist de campos
  crear: (data) => ProveedorService.create(data),
  audit: { tabla: "gu_proveedores", detalle: (p) => `Proveedor ${p.nombre} creado` },
  contexto: "POST /api/proveedores",
})
