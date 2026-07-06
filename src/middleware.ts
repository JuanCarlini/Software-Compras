import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Registro público deshabilitado: los usuarios los da de alta el admin (decisión 2026-07-04)
const publicRoutes = ['/login', '/api/auth/login']
const authRoutes = ['/login']

// Fail-fast: sin JWT_SECRET el sistema no debe arrancar con un secreto predecible
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está configurada. Definila en .env.local / variables de entorno del deploy.')
}
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET)

async function verificarToken(token: string): Promise<boolean> {
  try {
    // Verificación real de firma (HS256, mismo secreto que AuthService.login)
    await jwtVerify(token, SECRET_KEY, { algorithms: ['HS256'] })
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
