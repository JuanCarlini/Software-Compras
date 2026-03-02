import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/auth.cookies"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        message: "No hay usuario autenticado"
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol_id: user.rol_id,
        rol_nombre: user.rol_nombre
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: "Error al obtener información del usuario",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
