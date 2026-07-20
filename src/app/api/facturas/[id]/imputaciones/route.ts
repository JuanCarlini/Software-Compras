import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { ImputarSchema } from "@/shared/factura-validation"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { HttpError } from "@/shared/http-error"

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/facturas/[id]/imputaciones - Imputar certificaciones (con monto) a la factura.
// Solo en borrador. 422 si la cert no está aprobada o si Σ supera el total de líneas.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const facturaId = parseId((await params).id)
    const { imputaciones } = ImputarSchema.parse(await request.json())

    await FacturaService.imputar(facturaId, imputaciones)
    return NextResponse.json({ message: "Imputaciones agregadas" }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/facturas/[id]/imputaciones")
  }
}

// DELETE /api/facturas/[id]/imputaciones?certificacionId=N - Quitar una imputación (borrador)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const facturaId = parseId((await params).id)
    const certParam = request.nextUrl.searchParams.get("certificacionId")
    if (!certParam) throw new HttpError(400, "Falta el parámetro certificacionId")

    const ok = await FacturaService.desimputar(facturaId, parseId(certParam))
    if (!ok) return NextResponse.json({ error: "Imputación no encontrada" }, { status: 404 })

    return NextResponse.json({ message: "Imputación eliminada" })
  } catch (error) {
    return handleRouteError(error, "DELETE /api/facturas/[id]/imputaciones")
  }
}
