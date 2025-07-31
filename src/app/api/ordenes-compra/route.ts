import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { CreateOrdenCompraSchema } from "@/shared/orden-compra-validation"

// GET /api/ordenes-compra - Obtener todas las órdenes
export async function GET() {
  try {
    const ordenes = await OrdenCompraService.getAll()
    return NextResponse.json(ordenes)
  } catch (error) {
    console.error("Error al obtener órdenes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// POST /api/ordenes-compra - Crear nueva orden
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = CreateOrdenCompraSchema.parse(body)
    
    // Crear la orden
    const nuevaOrden = await OrdenCompraService.create(validatedData)
    
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
