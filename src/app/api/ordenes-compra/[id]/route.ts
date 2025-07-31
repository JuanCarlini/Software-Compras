import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { UpdateOrdenCompraSchema, OrdenCompraParamsSchema } from "@/shared/orden-compra-validation"

// GET /api/ordenes-compra/[id] - Obtener una orden específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = OrdenCompraParamsSchema.parse(params)
    
    const orden = await OrdenCompraService.getById(id)
    
    if (!orden) {
      return NextResponse.json(
        { error: "Orden de compra no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(orden)
  } catch (error) {
    console.error("Error al obtener orden:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/ordenes-compra/[id] - Actualizar una orden
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = OrdenCompraParamsSchema.parse(params)
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = UpdateOrdenCompraSchema.parse(body)
    
    // Actualizar la orden
    const ordenActualizada = await OrdenCompraService.update(id, validatedData)
    
    if (!ordenActualizada) {
      return NextResponse.json(
        { error: "Orden de compra no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(ordenActualizada)
  } catch (error) {
    console.error("Error al actualizar orden:", error)
    
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

// DELETE /api/ordenes-compra/[id] - Eliminar una orden
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = OrdenCompraParamsSchema.parse(params)
    
    const eliminada = await OrdenCompraService.delete(id)
    
    if (!eliminada) {
      return NextResponse.json(
        { error: "Orden de compra no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: "Orden eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar orden:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
