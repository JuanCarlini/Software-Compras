import { NextRequest, NextResponse } from "next/server"
import { AuthController } from "@/controllers"
import { createErrorResponse } from "@/shared/errors"
import { z } from "zod"

// Schema de validación para login
const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data
    
    // Intentar autenticación
    const user = await AuthController.login({ email, password })
    
    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // TODO: Generar JWT token real
    const token = `mock-jwt-${user.id}-${Date.now()}`
    
    return NextResponse.json({
      user,
      token,
      message: "Login exitoso"
    })
    
  } catch (error) {
    console.error("Error en login:", error)
    const errorResponse = createErrorResponse(error as Error)
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    )
  }
}
