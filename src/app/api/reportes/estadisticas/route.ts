import { NextResponse } from "next/server"
import { ReporteController } from "@/controllers"

export async function GET() {
  try {
    const estadisticas = await ReporteController.getEstadisticas()
    return NextResponse.json(estadisticas)
  } catch (error) {
    console.error("Error fetching estadísticas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
