import { NextRequest, NextResponse } from "next/server"
import { CajaService } from "@/controllers"
import { UpdateCajaSchema } from "@/shared/caja-validation"
import { requireAdmin } from "@/shared/permissions-server"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { AuditService } from "@/lib/audit/audit.service"

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/cajas/[id] — autentica el middleware
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseId((await params).id)
    const caja = await CajaService.getById(id)
    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 })

    return NextResponse.json(caja)
  } catch (error) {
    return handleRouteError(error, "GET /api/cajas/[id]")
  }
}

// PUT /api/cajas/[id] - Editar caja (solo admin). Cambiar la moneda devuelve 422.
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const id = parseId((await params).id)
    const validatedData = UpdateCajaSchema.parse(await request.json())

    const actualizada = await CajaService.update(id, validatedData)
    if (!actualizada) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 })

    await AuditService.registrarDesdeRequest({
      tabla: "gu_cajas",
      registroId: id,
      accion: "actualizar",
      detalle: `Caja ${actualizada.nombre} actualizada`,
    })

    return NextResponse.json(actualizada)
  } catch (error) {
    return handleRouteError(error, "PUT /api/cajas/[id]")
  }
}

// DELETE /api/cajas/[id] - Baja lógica (las líneas de OP apuntan a la caja)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const id = parseId((await params).id)
    await CajaService.delete(id)

    await AuditService.registrarDesdeRequest({
      tabla: "gu_cajas",
      registroId: id,
      accion: "eliminar",
      detalle: `Caja #${id} dada de baja`,
    })

    return NextResponse.json({ message: "Caja dada de baja correctamente" })
  } catch (error) {
    return handleRouteError(error, "DELETE /api/cajas/[id]")
  }
}
