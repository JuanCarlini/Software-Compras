import { NextRequest, NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function POST(request: NextRequest) {
  try {
    const { configJson } = await request.json()
    
    if (!configJson) {
      return NextResponse.json(
        { error: "No se envió configuración para importar" },
        { status: 400 }
      )
    }

    const success = await ConfiguracionController.importarConfiguracion(configJson)
    
    return NextResponse.json({ success })
  } catch (error) {
    console.error("Error importing configuracion:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    )
  }
}
