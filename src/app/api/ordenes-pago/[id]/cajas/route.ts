import { NextRequest, NextResponse } from "next/server"
import { OrdenPagoService } from "@/controllers"
import { AgregarCajaSchema } from "@/shared/orden-pago-validation"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { HttpError } from "@/shared/http-error"

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/ordenes-pago/[id]/cajas - Repartir el pago en una caja.
// La moneda de la caja y que Σcajas = total se validan al mandar a aprobar (fn_op_gate),
// no acá: la regla vive en el trigger.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const opId = parseId((await params).id)
    const { caja_id, monto } = AgregarCajaSchema.parse(await request.json())

    const linea = await OrdenPagoService.agregarCaja(opId, { caja_id, monto })
    return NextResponse.json(linea, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/ordenes-pago/[id]/cajas")
  }
}

// DELETE /api/ordenes-pago/[id]/cajas?cajaId=N
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const opId = parseId((await params).id)
    const cajaParam = request.nextUrl.searchParams.get("cajaId")
    if (!cajaParam) throw new HttpError(400, "Falta el parámetro cajaId")

    const ok = await OrdenPagoService.quitarCaja(opId, parseId(cajaParam))
    if (!ok) return NextResponse.json({ error: "Línea no encontrada" }, { status: 404 })

    return NextResponse.json({ message: "Caja quitada de la orden de pago" })
  } catch (error) {
    return handleRouteError(error, "DELETE /api/ordenes-pago/[id]/cajas")
  }
}
