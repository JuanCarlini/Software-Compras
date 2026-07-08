import { NextRequest, NextResponse } from "next/server"
import { CajaService } from "@/controllers"
import { CreateCajaSchema } from "@/shared/caja-validation"
import { requireAdmin } from "@/shared/permissions-server"
import { handleRouteError } from "@/shared/handle-route-error"
import { AuditService } from "@/lib/audit/audit.service"

// GET /api/cajas - Cajas activas (la OP las necesita; autentica el middleware)
export async function GET(request: NextRequest) {
  try {
    const incluirInactivas = request.nextUrl.searchParams.get("incluirInactivas") === "true"
    const cajas = incluirInactivas
      ? await CajaService.getAllIncludingInactive()
      : await CajaService.getAll()

    return NextResponse.json(cajas)
  } catch (error) {
    return handleRouteError(error, "GET /api/cajas")
  }
}

// POST /api/cajas - Crear caja (solo admin: es catálogo)
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const validatedData = CreateCajaSchema.parse(await request.json())
    const nuevaCaja = await CajaService.create(validatedData)

    await AuditService.registrarDesdeRequest({
      tabla: "gu_cajas",
      registroId: nuevaCaja.id,
      accion: "crear",
      detalle: `Caja ${nuevaCaja.nombre} (${nuevaCaja.tipo}, ${nuevaCaja.moneda}) creada`,
    })

    return NextResponse.json(nuevaCaja, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/cajas")
  }
}
