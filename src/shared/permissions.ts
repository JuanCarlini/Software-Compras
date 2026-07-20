import { UserRole } from "@/models"

// Grupos de roles para autorizar rutas (S1). Centralizado a propósito:
// cambiar acá impacta a TODAS las rutas que usan requireRole.
export const ROLES_ESCRITURA: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.USUARIO] // crear/editar (readonly excluido)
export const ROLES_DESTRUCTIVO: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR] // borrar/anular/aprobar
// ponytail: si el negocio quiere que 'usuario' borre sus borradores, agregar UserRole.USUARIO a ROLES_DESTRUCTIVO — un solo lugar.

// Aprobar / rechazar / anular / pagar. Hoy es el mismo set que ROLES_DESTRUCTIVO, nombrado
// por intención: si mañana 'usuario' puede borrar sus borradores pero no aprobar, se separan acá.
export const ROLES_APROBACION: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR]

/**
 * Verifica si un usuario tiene permiso para anular documentos
 * Solo supervisores y administradores pueden anular documentos
 */
export function canAnularDocumento(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR
}

/**
 * Verifica si un usuario tiene permiso para modificar proveedores
 * Solo supervisores y administradores pueden suspender o activar proveedores
 */
export function canModificarProveedor(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR
}

/**
 * Verifica si un usuario tiene permisos de administrador
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}

/**
 * Verifica si un usuario tiene permisos de supervisor o superior
 */
export function isSupervisorOrAbove(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR
}

/**
 * Verifica si un usuario puede aprobar documentos
 */
export function canAprobarDocumento(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR
}

/**
 * Convierte string de rol a UserRole enum
 */
export function stringToUserRole(rol: string): UserRole {
  const roleLower = rol.toLowerCase()
  switch (roleLower) {
    case "admin":
      return UserRole.ADMIN
    case "supervisor":
      return UserRole.SUPERVISOR
    case "readonly":
      return UserRole.READONLY
    case "usuario":
    default:
      return UserRole.USUARIO
  }
}

// RBAC real (PERM-04/05). Chequeo PURO de permisos, sin DB: 'admin' pasa siempre
// (short-circuit anti auto-lockout — no se puede lockear al sistema editando permisos);
// el resto por membership en su array `modulo:accion`. La resolución del array (I/O contra
// gu_roles.permisos) vive en requirePermission/rol.repository; acá solo la decisión, para
// poder testearla sin Supabase. Es la única fuente de verdad del "puede o no".
export function tienePermiso(
  rolNombre: string,
  permisos: string[],
  modulo: string,
  accion: string
): boolean {
  if (rolNombre.toLowerCase() === "admin") return true
  return permisos.includes(`${modulo}:${accion}`)
}
