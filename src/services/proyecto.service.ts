import { ProyectoRepository } from "@/repositories/proyecto.repository"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"

// CRUD de proyectos. Sin reglas de negocio propias hoy: delega el I/O al repo.
// La capa existe como costura donde irían futuras reglas y para mantener la
// convención ruta -> service -> repo uniforme en todos los dominios.
export class ProyectoService {
  static getAll() {
    return ProyectoRepository.findAll()
  }

  static getById(id: number) {
    return ProyectoRepository.findById(id)
  }

  static create(proyecto: TablesInsert<"gu_proyectos">) {
    return ProyectoRepository.insert(proyecto)
  }

  static update(id: number, proyecto: TablesUpdate<"gu_proyectos">) {
    return ProyectoRepository.update(id, proyecto)
  }

  static delete(id: number) {
    return ProyectoRepository.delete(id)
  }
}
