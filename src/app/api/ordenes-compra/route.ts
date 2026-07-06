import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { CreateOrdenCompraSchema } from "@/shared/orden-compra-validation"
import { AuditService } from "@/lib/audit/audit.service"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"

// GET /api/ordenes-compra - Obtener todas las órdenes
export async function GET() {
  try {
    const ordenes = await OrdenCompraService.getAll()
    return NextResponse.json(ordenes || [])
  } catch (error) {
    console.error("Error al obtener órdenes:", error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/ordenes-compra - Crear nueva orden
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const body = await request.json()

    // Validar datos de entrada
    const validatedData = CreateOrdenCompraSchema.parse(body)
    
    // Crear la orden (cabecera + líneas)
    const nuevaOrden = await OrdenCompraService.create(validatedData)

    await AuditService.registrarDesdeRequest({
      tabla: "gu_ordenesdecompra",
      registroId: nuevaOrden.id,
      accion: "crear",
      detalle: `Orden de compra ${nuevaOrden.numero_oc} creada`,
    })

    return NextResponse.json(nuevaOrden, { status: 201 })
  } catch (error) {
    console.error("Error al crear orden:", error)
    
    // Si es error de validación
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
