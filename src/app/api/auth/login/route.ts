import { NextRequest, NextResponse } from "next/server"
import { AuthService } from '@/lib/auth/auth.service'
import { setAuthCookie } from '@/lib/auth/auth.cookies'
import { AuditService } from '@/lib/audit/audit.service'
import { estaBloqueado, registrarFallo, limpiarIntentos } from '@/lib/auth/rate-limit'

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

    // S3: rate-limiting por IP+email contra fuerza bruta
    const now = Date.now()
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rlKey = `${ip}:${String(email).toLowerCase()}`
    const rl = estaBloqueado(rlKey, now)
    if (rl.bloqueado) {
      return NextResponse.json(
        { error: "Demasiados intentos fallidos. Probá de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      )
    }

    // Intentar login
    const result = await AuthService.login(email, password)

    if (!result) {
      registrarFallo(rlKey, now)
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      )
    }

    // Login OK: limpiar el contador de intentos
    limpiarIntentos(rlKey)

    // Establecer cookie de autenticación
    await setAuthCookie(result.token)

    // Bitácora: inicio de sesión (T06)
    await AuditService.registrar({
      usuarioId: result.user.id,
      tabla: 'sesion',
      registroId: result.user.id,
      accion: 'login',
      detalle: `Inicio de sesión: ${result.user.email}`,
    })

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
