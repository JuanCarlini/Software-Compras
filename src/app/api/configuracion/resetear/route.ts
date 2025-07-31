import { NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function POST() {
  try {
    const success = await ConfiguracionController.resetearConfiguracion()
    return NextResponse.json({ success })
  } catch (error) {
    console.error("Error resetting configuracion:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
