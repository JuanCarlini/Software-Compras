import { NextRequest, NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function GET() {
  try {
    const empresa = await ConfiguracionController.getEmpresa()
    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error fetching empresa:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const updatedEmpresa = await ConfiguracionController.updateEmpresa(data)
    return NextResponse.json(updatedEmpresa)
  } catch (error) {
    console.error("Error updating empresa:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
