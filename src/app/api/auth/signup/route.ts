import { NextRequest, NextResponse } from "next/server"
import { AuthService } from '@/lib/auth/auth.service'
import { setAuthCookie } from '@/lib/auth/auth.cookies'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre, rolId } = body
    
    // Validar campos requeridos
    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son requeridos" },
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

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    // Intentar registro (por defecto rol_id = 2 si no se especifica)
    const result = await AuthService.signup(
      email, 
      password, 
      nombre, 
      rolId || 2
    )
    
    if (!result) {
      return NextResponse.json(
        { error: "Error al crear la cuenta. El email puede estar ya registrado." },
        { status: 400 }
      )
    }

    // Establecer cookie de autenticación
    await setAuthCookie(result.token)

    // Retornar usuario
    return NextResponse.json({
      user: result.user,
      message: "Cuenta creada exitosamente"
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error en signup:', error)
    const errorMessage = error instanceof Error ? error.message : "Error al crear cuenta"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
