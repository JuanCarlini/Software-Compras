import { RolRepository } from "@/repositories/rol.repository"

// Los 4 roles base están cableados a los permisos del código (shared/permissions.ts):
// renombrarlos o borrarlos rompería el mapeo. Roles nuevos son válidos pero reciben
// permisos de "usuario" por defecto (stringToUserRole cae en USUARIO si no matchea).
const ROLES_SISTEMA = ["admin", "usuario", "supervisor", "readonly"]

// Reglas de negocio de roles. El I/O vive en RolRepository (A1).
export class RolService {
  static async getAll() {
    const roles = await RolRepository.findAllOrdered()

    // cantidad de usuarios por rol (para bloquear borrado de roles en uso)
    const rolIds = await RolRepository.findAllUsuarioRolIds()
    const conteo = new Map<number, number>()
    for (const rolId of rolIds) {
      conteo.set(rolId, (conteo.get(rolId) || 0) + 1)
    }

    return roles.map((rol: any) => ({
      ...rol,
      usuarios: conteo.get(rol.id) || 0,
      es_sistema: ROLES_SISTEMA.includes(rol.nombre),
    }))
  }

  static async create(data: { nombre: string; descripcion?: string }) {
    const nombre = data.nombre.trim().toLowerCase()

    if (await RolRepository.findByNombre(nombre)) {
      throw new Error(`Ya existe un rol llamado "${nombre}"`)
    }

    return RolRepository.insert({ nombre, descripcion: data.descripcion ?? null })
  }

  static async update(id: number, data: { nombre?: string; descripcion?: string }) {
    const rol = await RolRepository.findById(id)
    if (!rol) throw new Error("Rol no encontrado")

    // los roles del sistema no se renombran (el código depende del nombre)
    if (data.nombre && ROLES_SISTEMA.includes(rol.nombre) && data.nombre.trim().toLowerCase() !== rol.nombre) {
      throw new Error(`"${rol.nombre}" es un rol del sistema y no puede renombrarse`)
    }

    const payload: Record<string, unknown> = {}
    if (data.nombre) payload.nombre = data.nombre.trim().toLowerCase()
    if (data.descripcion !== undefined) payload.descripcion = data.descripcion

    return RolRepository.update(id, payload)
  }

  static async delete(id: number) {
    const rol = await RolRepository.findById(id)
    if (!rol) throw new Error("Rol no encontrado")

    if (ROLES_SISTEMA.includes(rol.nombre)) {
      throw new Error(`"${rol.nombre}" es un rol del sistema y no puede eliminarse`)
    }

    const count = await RolRepository.countUsuariosByRol(id)
    if (count > 0) {
      throw new Error(`El rol tiene ${count} usuario(s) asignado(s); reasignalos antes de eliminarlo`)
    }

    await RolRepository.delete(id)
    return true
  }
}
