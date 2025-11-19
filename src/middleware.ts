import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = ['/login', '/signup', '/api/auth/login', '/api/auth/signup']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir rutas públicas sin autenticación
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Obtener token de la cookie
  const token = request.cookies.get('auth_token')?.value
  
  // Si no hay token y la ruta no es pública, redirigir a login
  if (!token && !isPublicRoute) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }
  
  // Si hay token y el usuario trata de acceder a login/signup, redirigir a dashboard
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    const url = new URL('/dashboard', request.url)
    return NextResponse.redirect(url)
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
