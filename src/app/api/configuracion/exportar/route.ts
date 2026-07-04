import { NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function GET() {
  try {
    const configJson = await ConfiguracionController.exportarConfiguracion()
    
    return new NextResponse(configJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="configuracion-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error("Error exporting configuracion:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
