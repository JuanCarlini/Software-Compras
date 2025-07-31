import { z } from "zod"
import { EstadoOrdenCompra } from "@/models"

export const OrdenCompraItemSchema = z.object({
  producto: z.string().min(1, "El producto es requerido"),
  descripcion: z.string().optional(),
  cantidad: z.number().min(1, "La cantidad debe ser mayor a 0"),
  precio_unitario: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  subtotal: z.number().min(0)
})

export const CreateOrdenCompraSchema = z.object({
  proveedor_id: z.string().min(1, "El proveedor es requerido"),
  fecha_entrega: z.date().min(new Date(), "La fecha de entrega debe ser futura"),
  descripcion: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  items: z.array(OrdenCompraItemSchema).min(1, "Debe incluir al menos un item")
})

export const UpdateOrdenCompraSchema = CreateOrdenCompraSchema.partial().extend({
  estado: z.nativeEnum(EstadoOrdenCompra).optional()
})

export const OrdenCompraParamsSchema = z.object({
  id: z.string().min(1, "ID requerido")
})

export type CreateOrdenCompraFormData = z.infer<typeof CreateOrdenCompraSchema>
export type UpdateOrdenCompraFormData = z.infer<typeof UpdateOrdenCompraSchema>
