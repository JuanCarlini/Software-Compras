import { UserRole } from "@/models"

// Los grupos de rol (ROLES_ESCRITURA/DESTRUCTIVO/APROBACION) y requireRole se
// retiraron cuando el RBAC por permisos (modulo:accion) los dejó sin consumidores: hoy las
// rutas autorizan con requirePermission contra gu_roles.permisos. Lo que queda acá son los
// helpers por ROL que siguen vivos (secciones /admin/* y gating de botones en la UI).

// Solo supervisores y administradores pueden anular documentos.
export function canAnularDocumento(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR
}

// Solo supervisores y administradores pueden suspender o activar proveedores.
export function canModificarProveedor(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}

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

// Chequeo PURO de permisos, sin DB: 'admin' pasa siempre
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
