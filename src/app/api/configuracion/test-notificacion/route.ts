import { NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"

export async function POST() {
  try {
    const result = await ConfiguracionController.testNotificacion()
    return NextResponse.json({ success: result })
  } catch (error) {
    console.error("Error testing notificacion:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
