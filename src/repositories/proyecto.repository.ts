import { createBaseRepository } from "./base.repository"

// Repositorio de gu_proyectos: CRUD estándar (A1) — findAll/findById/insert/update/delete
// idénticos al patrón base. Sin tipo de modelo propio (queda `any`, como estaba).
export const ProyectoRepository = createBaseRepository<any>("gu_proyectos")
