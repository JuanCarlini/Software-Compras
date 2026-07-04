import { NextRequest, NextResponse } from "next/server"
import { ReporteController } from "@/controllers"

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const reporte = await ReporteController.regenerar(id)
    
    if (!reporte) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(reporte)
  } catch (error) {
    console.error("Error regenerating reporte:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
