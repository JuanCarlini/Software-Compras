import { z } from "zod"
import { EstadoOrdenPago, MetodoPago } from "@/models"

export const CreateOrdenPagoSchema = z.object({
  orden_compra_id: z.string().min(1, "La orden de compra es requerida"),
  proveedor_id: z.string().min(1, "El proveedor es requerido"),
  fecha_vencimiento: z.date().min(new Date(), "La fecha de vencimiento debe ser futura"),
  monto: z.number().min(0.01, "El monto debe ser mayor a 0"),
  moneda: z.string().min(1, "La moneda es requerida"),
  metodo_pago: z.nativeEnum(MetodoPago),
  observaciones: z.string().optional()
})

export const UpdateOrdenPagoSchema = CreateOrdenPagoSchema.partial().extend({
  estado: z.nativeEnum(EstadoOrdenPago).optional(),
  referencia_bancaria: z.string().optional()
})

export const OrdenPagoParamsSchema = z.object({
  id: z.string().min(1, "ID requerido")
})

export const PagarOrdenSchema = z.object({
  referencia_bancaria: z.string().min(1, "La referencia bancaria es requerida")
})

export type CreateOrdenPagoFormData = z.infer<typeof CreateOrdenPagoSchema>
export type UpdateOrdenPagoFormData = z.infer<typeof UpdateOrdenPagoSchema>
export type PagarOrdenFormData = z.infer<typeof PagarOrdenSchema>
