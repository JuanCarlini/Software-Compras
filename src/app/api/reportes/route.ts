import { NextRequest, NextResponse } from "next/server"
import { ReporteController } from "@/controllers"

export async function GET() {
  try {
    const reportes = await ReporteController.getAll()
    return NextResponse.json(reportes)
  } catch (error) {
    console.error("Error fetching reportes:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const newReporte = await ReporteController.create(data)
    return NextResponse.json(newReporte, { status: 201 })
  } catch (error) {
    console.error("Error creating reporte:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
