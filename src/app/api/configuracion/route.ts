import { NextRequest, NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function GET() {
  try {
    const [empresa, sistema] = await Promise.all([
      ConfiguracionController.getEmpresa(),
      ConfiguracionController.getConfiguracionSistema()
    ])
    
    return NextResponse.json({
      empresa,
      sistema
    })
  } catch (error) {
    console.error("Error fetching configuracion:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
