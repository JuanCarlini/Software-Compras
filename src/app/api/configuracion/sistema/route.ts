import { NextRequest, NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function GET() {
  try {
    const configuracion = await ConfiguracionController.getConfiguracionSistema()
    return NextResponse.json(configuracion)
  } catch (error) {
    console.error("Error fetching configuracion sistema:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const updatedConfiguracion = await ConfiguracionController.updateConfiguracionSistema(data)
    return NextResponse.json(updatedConfiguracion)
  } catch (error) {
    console.error("Error updating configuracion sistema:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
