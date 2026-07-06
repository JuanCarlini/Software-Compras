import { UserRole } from "@/models"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/auth.cookies"
import { isAdmin, stringToUserRole } from "@/shared/permissions"

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

/**
 * Como requireAuth, pero además exige rol admin (rutas /api/admin/*)
 */
export async function requireAdmin() {
  const { error, user } = await requireAuth()
  if (error) return { error, user: null }

  if (!isAdmin(stringToUserRole(user!.rol))) {
    return {
      error: NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 }
      ),
      user: null
    }
  }

  return { error: null, user }
}

/**
 * Como requireAuth, pero además exige que el rol del usuario esté en la lista permitida.
 * Base de la autorización por rol en rutas mutantes (S1): el middleware sólo autentica.
 * Usar con los grupos de shared/permissions.ts (ROLES_ESCRITURA / ROLES_DESTRUCTIVO).
 * Solo para usar en API Routes.
 */
export async function requireRole(rolesPermitidos: UserRole[]) {
  const { error, user } = await requireAuth()
  if (error) return { error, user: null }

  if (!rolesPermitidos.includes(stringToUserRole(user!.rol))) {
    return {
      error: NextResponse.json(
        { error: "No tenés permisos para realizar esta acción" },
        { status: 403 }
      ),
      user: null
    }
  }

  return { error: null, user }
}
