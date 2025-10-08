import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "No se pudo autenticar el usuario" },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.user_metadata?.nombre || 'Usuario',
        rol: data.user.user_metadata?.rol || 'usuario'
      },
      session: data.session
    })
    
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
