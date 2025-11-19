import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const factura = await FacturaService.getById(parseInt(id))
    
    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(factura)
  } catch (error) {
    console.error("Error fetching factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    const factura = await FacturaService.update(parseInt(id), data)
    
    if (!factura) {
      return NextResponse.json(
        { error: "Error al actualizar factura" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(factura)
  } catch (error) {
    console.error("Error updating factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = await FacturaService.delete(parseInt(id))
    
    if (!success) {
      return NextResponse.json(
        { error: "Error al eliminar factura" },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
