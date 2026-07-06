import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Registro público deshabilitado: los usuarios los da de alta el admin (decisión 2026-07-04)
const publicRoutes = ['/login', '/api/auth/login']
const authRoutes = ['/login']

async function verificarToken(token: string): Promise<boolean> {
  // Se lee en cada request (no a nivel de módulo: eso rompe el build de Next).
  const secret = process.env.JWT_SECRET
  if (!secret) {
    // Fail-CLOSED: sin secreto no se puede validar → el token se trata como inválido
    // (el usuario cae a /login o recibe 401), nunca se deja pasar.
    console.error('JWT_SECRET no está configurada en el entorno.')
    return false
  }
  try {
    // Verificación real de firma (HS256, mismo secreto que AuthService.login)
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] })
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api')

  const token = request.cookies.get('auth_token')?.value
  const tokenValido = token ? await verificarToken(token) : false

  // Sin token válido y ruta protegida: 401 para API, redirect a login para páginas
  if (!tokenValido && !isPublicRoute) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const response = NextResponse.redirect(new URL('/login', request.url))
    if (token) {
      // cookie presente pero inválida/expirada/falsificada: limpiarla
      response.cookies.delete('auth_token')
    }
    return response
  }

  // Usuario autenticado intentando ir a login: mandarlo al dashboard
  if (tokenValido && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
