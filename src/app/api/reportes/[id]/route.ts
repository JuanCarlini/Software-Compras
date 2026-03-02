import { NextRequest, NextResponse } from "next/server"
import { ReporteController } from "@/controllers"

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const reporte = await ReporteController.getById(id)
    
    if (!reporte) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(reporte)
  } catch (error) {
    console.error("Error fetching reporte:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const success = await ReporteController.delete(id)
    
    if (!success) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: "Reporte eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting reporte:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
