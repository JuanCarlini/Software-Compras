import { NextRequest, NextResponse } from "next/server"
import { AuthService } from '@/lib/auth/auth.service'
import { setAuthCookie } from '@/lib/auth/auth.cookies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400 }
      )
    }

    // Intentar login
    const result = await AuthService.login(email, password)
    
    if (!result) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Establecer cookie de autenticación
    await setAuthCookie(result.token)

    // Retornar usuario (sin el token en el body por seguridad)
    return NextResponse.json({
      user: result.user,
      message: "Inicio de sesión exitoso"
    })
    
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
