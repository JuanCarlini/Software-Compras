import bcrypt from "bcryptjs"
import { UsuarioRepository } from "@/repositories/usuario.repository"
import { RolRepository } from "@/repositories/rol.repository"
import { HttpError } from "@/shared/http-error"

export interface CreateUsuarioData {
  nombre: string
  email: string
  password: string
  rol_id: number
}

export interface UpdateUsuarioData {
  nombre?: string
  email?: string
  rol_id?: number
  estado?: "activo" | "inactivo"
}

// Gestión de usuarios por administrador (T02/T04). El I/O vive en UsuarioRepository (A1);
// acá quedan las reglas: unicidad de email, hasheo de clave y la "baja" lógica
// (estado = inactivo; el login filtra por estado activo).
export class UsuarioService {
  // Listado para la administración de usuarios: mapea la fila + join de rol al shape de la UI.
  static async getAll() {
    const rows = await UsuarioRepository.findAllConRoles()
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre || "",
      apellido: "", // no existe en gu_usuario; la UI lo espera
      rol: (u.gu_roles as { nombre?: string } | null)?.nombre?.toLowerCase() || "usuario",
      rol_id: u.rol_id,
      estado: u.estado ?? "activo",
      created_at: u.created_at,
      last_sign_in_at: null, // no se registra en gu_usuario
    }))
  }

  static async create(data: CreateUsuarioData) {
    if (await UsuarioRepository.findByEmail(data.email)) {
      throw new HttpError(409, "El email ya está registrado")
    }

    const password_hash = await bcrypt.hash(data.password, 10)

    return UsuarioRepository.insert({
      nombre: data.nombre,
      email: data.email,
      password_hash,
      rol_id: data.rol_id,
      estado: "activo",
    })
  }

  static async update(id: number, data: UpdateUsuarioData) {
    // cast al borde de persistencia (el repo trabaja con columnas sueltas, sin tipar)
    return UsuarioRepository.update(id, { ...data } as Record<string, unknown>)
  }

  // Cambio de rol por admin. Antes esta lógica vivía en la ruta con .from() crudo
  // (violaba SRP/DIP); acá delega a los repos. Guarda anti auto-lockout: un admin
  // no puede quitarse a sí mismo el rol admin.
  static async updateRol(id: number, nuevoRol: string, actor: { id: number }) {
    const VALIDOS = ["admin", "supervisor", "usuario", "readonly"]
    if (!VALIDOS.includes(nuevoRol)) {
      throw new HttpError(400, "Rol inválido")
    }

    const actual = await UsuarioRepository.findById(id)
    if (!actual) {
      throw new HttpError(404, "Usuario no encontrado")
    }

    const rolActual = (actual.gu_roles as { nombre?: string } | null)?.nombre?.toLowerCase()
    if (actual.id === actor.id && rolActual === "admin" && nuevoRol !== "admin") {
      throw new HttpError(400, "No puedes quitarte a ti mismo el rol de administrador")
    }

    const rolNuevo = await RolRepository.findByNombre(nuevoRol)
    if (!rolNuevo) {
      throw new HttpError(404, "Rol no encontrado")
    }

    await UsuarioRepository.update(id, { rol_id: rolNuevo.id })
    return { id: actual.id, email: actual.email, rol: nuevoRol }
  }

  // Reset administrativo: pisa la clave sin pedir la anterior (distinto de changePassword)
  static async resetPassword(id: number, newPassword: string) {
    const password_hash = await bcrypt.hash(newPassword, 10)
    await UsuarioRepository.updatePassword(id, password_hash)
    return true
  }
}
