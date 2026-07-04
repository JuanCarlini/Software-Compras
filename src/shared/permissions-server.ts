import { UserRole } from "@/models"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/auth.cookies"

/**
 * Obtiene el usuario autenticado desde el servidor
 * Solo para usar en Server Components y API Routes
 */
export async function getAuthenticatedUser() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // El usuario ya viene con toda la información de gu_usuario
  return {
    id: user.id.toString(), // Convertir a string para mantener compatibilidad
    email: user.email,
    nombre: user.nombre,
    rol: user.rol_nombre?.toLowerCase() || 'usuario'
  }
}

/**
 * Middleware para verificar autenticación y permisos
 * Retorna el usuario si está autenticado, o un NextResponse con error 401/403
 * Solo para usar en API Routes
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      ),
      user: null
    }
  }

  return { error: null, user }
}
