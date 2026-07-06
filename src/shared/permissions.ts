import { UserRole } from "@/models"

// Grupos de roles para autorizar rutas (S1). Centralizado a propósito:
// cambiar acá impacta a TODAS las rutas que usan requireRole.
export const ROLES_ESCRITURA: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.USUARIO] // crear/editar (readonly excluido)
export const ROLES_DESTRUCTIVO: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR] // borrar/anular/aprobar
// ponytail: si el negocio quiere que 'usuario' borre sus borradores, agregar UserRole.USUARIO a ROLES_DESTRUCTIVO — un solo lugar.

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
