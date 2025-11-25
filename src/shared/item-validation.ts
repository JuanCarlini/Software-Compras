import { z } from "zod"

export const CreateItemSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200, "El nombre no puede exceder 200 caracteres"),
  descripcion: z.string().optional().nullable(),
  precio_sugerido: z.number().nonnegative("El precio debe ser mayor o igual a 0").optional().nullable(),
  unidad_medida: z.string().max(50, "La unidad de medida no puede exceder 50 caracteres").optional().nullable(),
  categoria: z.string().max(100, "La categoría no puede exceder 100 caracteres").optional().nullable(),
  created_by: z.number().optional().nullable()
})

export const UpdateItemSchema = CreateItemSchema.partial().extend({
  is_active: z.boolean().optional()
})

export const ItemParamsSchema = z.object({
  id: z.string().min(1, "ID requerido")
})

export const ItemSearchSchema = z.object({
  query: z.string().min(1, "Query de búsqueda requerido")
})

export type CreateItemFormData = z.infer<typeof CreateItemSchema>
export type UpdateItemFormData = z.infer<typeof UpdateItemSchema>
