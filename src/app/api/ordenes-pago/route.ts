import { NextRequest, NextResponse } from "next/server"
import { OrdenPagoService } from "@/controllers"
import { CreateOrdenPagoSchema } from "@/shared/orden-pago-validation"

// GET /api/ordenes-pago - Obtener todas las órdenes de pago
export async function GET() {
  try {
    const ordenes = await OrdenPagoService.getAll()
    return NextResponse.json(ordenes)
  } catch (error) {
    console.error("Error al obtener órdenes de pago:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/ordenes-pago - Crear nueva orden de pago
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = CreateOrdenPagoSchema.parse(body)
    
    // Crear la orden
    const nuevaOrden = await OrdenPagoService.create(validatedData)
    
    return NextResponse.json(nuevaOrden, { status: 201 })
  } catch (error) {
    console.error("Error al crear orden de pago:", error)
    
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
