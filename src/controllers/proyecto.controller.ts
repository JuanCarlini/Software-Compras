import { ProyectoRepository } from "@/repositories/proyecto.repository"

// CRUD de proyectos. Sin reglas de negocio propias hoy: delega el I/O al repo (A1).
// La capa existe como costura donde irían futuras reglas y para mantener la
// convención ruta -> service -> repo uniforme en todos los dominios.
export class ProyectoService {
  static getAll() {
    return ProyectoRepository.findAll()
  }

  static getById(id: number) {
    return ProyectoRepository.findById(id)
  }

  static create(proyecto: any) {
    return ProyectoRepository.insert(proyecto)
  }

  static update(id: number, proyecto: any) {
    return ProyectoRepository.update(id, proyecto)
  }

  static delete(id: number) {
    return ProyectoRepository.delete(id)
  }
}
