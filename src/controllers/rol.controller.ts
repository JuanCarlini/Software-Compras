import { createClient } from "@/lib/supabase/service"

const TABLE = "gu_roles"

// Los 4 roles base están cableados a los permisos del código (shared/permissions.ts):
// renombrarlos o borrarlos rompería el mapeo. Roles nuevos son válidos pero reciben
// permisos de "usuario" por defecto (stringToUserRole cae en USUARIO si no matchea).
const ROLES_SISTEMA = ["admin", "usuario", "supervisor", "readonly"]

export class RolService {
  static async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, nombre, descripcion")
      .order("id", { ascending: true })

    if (error) throw error

    // cantidad de usuarios por rol (para bloquear borrado de roles en uso)
    const { data: usuarios, error: usersError } = await supabase
      .from("gu_usuario")
      .select("rol_id")

    if (usersError) throw usersError

    const conteo = new Map<number, number>()
    for (const u of usuarios || []) {
      conteo.set(u.rol_id, (conteo.get(u.rol_id) || 0) + 1)
    }

    return (data || []).map((rol) => ({
      ...rol,
      usuarios: conteo.get(rol.id) || 0,
      es_sistema: ROLES_SISTEMA.includes(rol.nombre),
    }))
  }

  static async create(data: { nombre: string; descripcion?: string }) {
    const supabase = createClient()
    const nombre = data.nombre.trim().toLowerCase()

    const { data: existente } = await supabase
      .from(TABLE)
      .select("id")
      .eq("nombre", nombre)
      .maybeSingle()

    if (existente) {
      throw new Error(`Ya existe un rol llamado "${nombre}"`)
    }

    const { data: nuevo, error } = await supabase
      .from(TABLE)
      .insert({ nombre, descripcion: data.descripcion ?? null })
      .select()
      .single()

    if (error) throw error
    return nuevo
  }

  static async update(id: number, data: { nombre?: string; descripcion?: string }) {
    const supabase = createClient()

    const { data: rol, error: getError } = await supabase
      .from(TABLE)
      .select("id, nombre")
      .eq("id", id)
      .single()

    if (getError || !rol) throw new Error("Rol no encontrado")

    // los roles del sistema no se renombran (el código depende del nombre)
    if (data.nombre && ROLES_SISTEMA.includes(rol.nombre) && data.nombre.trim().toLowerCase() !== rol.nombre) {
      throw new Error(`"${rol.nombre}" es un rol del sistema y no puede renombrarse`)
    }

    const payload: Record<string, unknown> = {}
    if (data.nombre) payload.nombre = data.nombre.trim().toLowerCase()
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion

    const { data: actualizado, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return actualizado
  }

  static async delete(id: number) {
    const supabase = createClient()

    const { data: rol, error: getError } = await supabase
      .from(TABLE)
      .select("id, nombre")
      .eq("id", id)
      .single()

    if (getError || !rol) throw new Error("Rol no encontrado")

    if (ROLES_SISTEMA.includes(rol.nombre)) {
      throw new Error(`"${rol.nombre}" es un rol del sistema y no puede eliminarse`)
    }

    const { count, error: countError } = await supabase
      .from("gu_usuario")
      .select("id", { count: "exact", head: true })
      .eq("rol_id", id)

    if (countError) throw countError
    if ((count ?? 0) > 0) {
      throw new Error(`El rol tiene ${count} usuario(s) asignado(s); reasignalos antes de eliminarlo`)
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) throw error
    return true
  }
}
