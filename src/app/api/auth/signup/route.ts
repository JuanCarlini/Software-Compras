import { NextRequest, NextResponse } from "next/server"
import { UserController } from "@/controllers"
import { createErrorResponse } from "@/shared/errors"
import { RegisterSchema } from "@/shared/auth-validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada con Zod
    const validationResult = RegisterSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { email, password, nombre, apellido, rol } = validationResult.data
    
    // TODO: Verificar que el email no exista (implementar cuando haya BD)
    // TODO: Hashear la contraseña antes de guardar
    
    // Crear el usuario
    const newUser = await UserController.create({
      email,
      nombre,
      apellido,
      rol
    })
    
    // TODO: Generar JWT token real
    const token = `mock-jwt-${newUser.id}-${Date.now()}`
    
    // Retornar usuario creado sin la contraseña
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      rol: newUser.rol
    }
    
    return NextResponse.json({
      user: userResponse,
      token,
      message: "Usuario creado exitosamente"
    }, { status: 201 })
    
  } catch (error) {
    console.error("Error en signup:", error)
    const errorResponse = createErrorResponse(error as Error)
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode || 500 }
    )
  }
}
