import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, nombre, apellido, rol } = body
    
    if (!email || !password || !nombre) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido: apellido || '',
          rol: rol || 'usuario'
        }
      }
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        nombre,
        apellido,
        rol: rol || 'usuario'
      },
      message: "Usuario creado exitosamente"
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error en signup:', error)
    return NextResponse.json(
      { error: "Error al crear cuenta" },
      { status: 500 }
    )
  }
}
