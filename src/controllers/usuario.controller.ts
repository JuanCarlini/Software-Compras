import bcrypt from "bcryptjs"
import { createClient } from "@/lib/supabase/service"

const TABLE = "gu_usuario"
const SELECT_SIN_HASH = "id, nombre, email, rol_id, estado, created_at, gu_roles(nombre)"

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

// Gestión de usuarios por administrador (T02/T04).
// La "baja" es lógica: estado = inactivo (el login filtra por estado activo).
export class UsuarioService {
  static async create(data: CreateUsuarioData) {
    const supabase = createClient()

    const { data: existente } = await supabase
      .from(TABLE)
      .select("id")
      .eq("email", data.email)
      .maybeSingle()

    if (existente) {
      throw new Error("El email ya está registrado")
    }

    const password_hash = await bcrypt.hash(data.password, 10)

    const { data: nuevo, error } = await supabase
      .from(TABLE)
      .insert({
        nombre: data.nombre,
        email: data.email,
        password_hash,
        rol_id: data.rol_id,
        estado: "activo",
      })
      .select(SELECT_SIN_HASH)
      .single()

    if (error) throw error
    return nuevo
  }

  static async update(id: number, data: UpdateUsuarioData) {
    const supabase = createClient()
    const { data: actualizado, error } = await supabase
      .from(TABLE)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(SELECT_SIN_HASH)
      .single()

    if (error) throw error
    return actualizado
  }

  // Reset administrativo: pisa la clave sin pedir la anterior (distinto de changePassword)
  static async resetPassword(id: number, newPassword: string) {
    const supabase = createClient()
    const password_hash = await bcrypt.hash(newPassword, 10)

    const { error } = await supabase
      .from(TABLE)
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) throw error
    return true
  }
}
