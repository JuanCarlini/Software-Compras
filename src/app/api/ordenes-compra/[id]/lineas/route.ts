import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { CreateOrdenCompraLineaSchema } from "@/shared/orden-compra-validation"
import { requirePermission } from "@/shared/permissions-server"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/ordenes-compra/[id]/lineas - Líneas con el item del catálogo y su avance certificado
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requirePermission("ordenes_compra", "ver")
    if (authError) return authError

    const ordenId = parseId((await params).id)

    const [lineas, rollups] = await Promise.all([
      OrdenCompraService.getLinesWithItems(ordenId),
      OrdenCompraService.getLocRollups(ordenId),
    ])

    // El avance por línea lo publica v_loc_rollup (solo certificaciones aprobadas).
    const porLinea = new Map(rollups.map((r) => [r.linea_oc_id, r]))
    return NextResponse.json(
      lineas.map((l) => ({
        ...l,
        unidades_certificadas: Number(porLinea.get(l.id)?.unidades_certificadas ?? 0),
        unidades_pendientes: Number(porLinea.get(l.id)?.unidades_pendientes ?? l.cantidad),
        estado_certificacion: porLinea.get(l.id)?.estado_certificacion ?? "sin",
      }))
    )
  } catch (error) {
    return handleRouteError(error, "GET /api/ordenes-compra/[id]/lineas")
  }
}

// POST /api/ordenes-compra/[id]/lineas - Agregar línea eligiendo un item del catálogo.
// Sin precio_unitario_neto se hereda el del proveedor; con precio, se guarda para él.
// 422 si la OC ya no es editable o el item no tiene precio para ese proveedor.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requirePermission("ordenes_compra", "crear")
    if (authError) return authError

    const ordenId = parseId((await params).id)
    const validatedData = CreateOrdenCompraLineaSchema.parse(await request.json())

    const nuevaLinea = await OrdenCompraService.addLinea(ordenId, validatedData)
    return NextResponse.json(nuevaLinea, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/ordenes-compra/[id]/lineas")
  }
}
