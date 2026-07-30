import { z } from "zod"

// Whitelist de campos para crear un proyecto. `estado` se OMITE a propósito: lo pone el
// default de la DB, no el cliente (anti mass-assignment); Zod descarta los campos extra.
export const PROYECTO_ESTADOS = ["planificado", "en_ejecucion", "finalizado", "cancelado"] as const

export const LABEL_PROYECTO_ESTADO: Record<(typeof PROYECTO_ESTADOS)[number], string> = {
  planificado: "Planificado",
  en_ejecucion: "En ejecución",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
}

export const CreateProyectoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  codigo: z.string().optional(),
  descripcion: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
})

export const UpdateProyectoSchema = CreateProyectoSchema.extend({
  estado: z.enum(PROYECTO_ESTADOS),
}).refine((p) => !p.fecha_inicio || !p.fecha_fin || p.fecha_inicio <= p.fecha_fin, {
  message: "La fecha de inicio no puede ser posterior a la de fin",
  path: ["fecha_inicio"],
})

export type CreateProyecto = z.infer<typeof CreateProyectoSchema>
export type UpdateProyecto = z.infer<typeof UpdateProyectoSchema>
