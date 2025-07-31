import { NextRequest, NextResponse } from "next/server"
import { ReporteController } from "@/controllers"

interface Params {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const reporte = await ReporteController.regenerar(params.id)
    
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
