import bcrypt from "bcryptjs"
import { UsuarioRepository } from "@/repositories/usuario.repository"
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

  // Reset administrativo: pisa la clave sin pedir la anterior (distinto de changePassword)
  static async resetPassword(id: number, newPassword: string) {
    const password_hash = await bcrypt.hash(newPassword, 10)
    await UsuarioRepository.updatePassword(id, password_hash)
    return true
  }
}
