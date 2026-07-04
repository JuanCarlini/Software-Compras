import { NextResponse } from "next/server"
import { removeAuthCookie } from '@/lib/auth/auth.cookies'

export async function POST() {
  try {
    // Eliminar cookie de autenticación
    await removeAuthCookie()

    return NextResponse.json({
      message: "Sesión cerrada exitosamente"
    })
    
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    )
  }
}
