import { NextResponse } from "next/server"
import { getCurrentUser } from '@/lib/auth/auth.cookies'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      )
    }

    // Mapear el usuario al formato esperado por el frontend (models/user.model.ts AuthUser)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol_nombre?.toLowerCase() || 'usuario'
      }
    })
    
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    )
  }
}
