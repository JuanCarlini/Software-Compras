import { UserRole } from "@/models"
import { NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/auth.cookies"
import { isAdmin, stringToUserRole, tienePermiso } from "@/shared/permissions"
import { RolRepository } from "@/repositories/rol.repository"

/**
 * Obtiene el usuario autenticado desde el servidor
 * Solo para usar en Server Components y API Routes
 */
export async function getAuthenticatedUser() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // El usuario ya viene con toda la información de gu_usuario.
  // id es number (PK BIGINT) de punta a punta: stringificarlo acá rompía en silencio
  // las comparaciones `usuario.id === user.id` de las rutas admin.
  return {
    id: user.id,
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

/**
 * RBAC real (PERM-04): autoriza por PERMISO del rol (`modulo:accion`), no por grupo de rol
 * hardcodeado. Resuelve los permisos del rol frescos por request (sin staleness de JWT ni
 * re-login) y delega la decisión a `tienePermiso` (admin short-circuit + membership, PERM-05).
 * Mismo shape { error, user } que requireRole. Solo para API Routes.
 */
export async function requirePermission(modulo: string, accion: string) {
  const { error, user } = await requireAuth()
  if (error) return { error, user: null }

  // ponytail: admin igual pega la query y el short-circuit vive en tienePermiso (una sola
  // fuente de verdad). La lectura por nombre es un lookup indexado inocuo; si algún día pesa,
  // un isAdmin early-return antes de la query lo evita.
  const permisos = await RolRepository.findPermisosByNombre(user!.rol)
  if (!tienePermiso(user!.rol, permisos, modulo, accion)) {
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

/**
 * Guarda de PÁGINA (Server Components). Equivalente de requirePermission para páginas:
 * si no hay usuario redirige a /login; si el rol no tiene `modulo:accion`, redirige al
 * fallback (default /dashboard). Permisos frescos por request (sin staleness). La fuente
 * de verdad de la autorización sigue siendo la API — esto bloquea el acceso por URL directa.
 */
export async function requirePagePermission(modulo: string, accion: string, fallbackUrl = "/dashboard") {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/login")
  const permisos = await RolRepository.findPermisosByNombre(user.rol)
  if (!tienePermiso(user.rol, permisos, modulo, accion)) redirect(fallbackUrl)
  return { user }
}

/**
 * Guarda de PÁGINA por rol admin (Server Components): el equivalente de requireAdmin para
 * páginas. Las secciones /admin/* no son módulos de la matriz RBAC — son por rol —, así que
 * no consulta gu_roles.permisos. Bloquea el acceso por URL directa, que un guard en useEffect
 * no puede hacer (esconde la UI recién después de hidratar).
 */
export async function requirePageAdmin(fallbackUrl = "/dashboard") {
  const user = await getAuthenticatedUser()
  if (!user) redirect("/login")
  if (!isAdmin(stringToUserRole(user.rol))) redirect(fallbackUrl)
  return { user }
}
