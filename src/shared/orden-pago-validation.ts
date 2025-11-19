import { z } from "zod"

export const CreateOrdenPagoSchema = z.object({
  proveedor_id: z.number().min(1, "El proveedor es requerido"),
  fecha_op: z.string().min(1, "La fecha es requerida"),
  total_pago: z.number().min(0.01, "El monto debe ser mayor a 0"),
  estado: z.string().optional(),
  observaciones: z.string().nullable().optional(),
  lineas: z.array(z.object({
    factura_id: z.number().optional(),
    concepto: z.string().min(1, "El concepto es requerido"),
    monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
    forma_pago: z.string().min(1, "La forma de pago es requerida")
  })).min(1, "Debe haber al menos una línea de pago")
})

export const UpdateOrdenPagoSchema = z.object({
  estado: z.string().optional(),
  observaciones: z.string().nullable().optional()
})

export type CreateOrdenPagoFormData = z.infer<typeof CreateOrdenPagoSchema>
export type UpdateOrdenPagoFormData = z.infer<typeof UpdateOrdenPagoSchema>
