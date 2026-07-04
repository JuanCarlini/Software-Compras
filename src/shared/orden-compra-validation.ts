import { z } from "zod"
import type { OcEstado } from "@/models"

// Valores de public.oc_estado en la DB (mantener en sync con OcEstado)
const OC_ESTADOS = ["borrador", "en_aprobacion", "aprobado", "rechazado", "anulado"] as const satisfies readonly OcEstado[]

// Alineado con CreateOrdenCompraData (src/models/orden-compra.model.ts) y gu_ordenesdecompra
export const CreateOrdenCompraSchema = z.object({
  numero_oc: z.string().min(1, "El número de orden es requerido"),
  proveedor_id: z.number().int().positive("El proveedor es requerido"),
  proyecto_id: z.number().int().positive().nullable().optional(),
  fecha_oc: z.string().min(1, "La fecha es requerida"), // YYYY-MM-DD
  moneda: z.enum(["ARS", "USD", "EUR"]).optional(),
  total_neto: z.number().min(0),
  total_iva: z.number().min(0),
  total_con_iva: z.number().min(0),
  estado: z.enum(OC_ESTADOS).optional(),
  observaciones: z.string().nullable().optional()
})

export const UpdateOrdenCompraSchema = CreateOrdenCompraSchema.partial()

export const OrdenCompraParamsSchema = z.object({
  id: z.string().min(1, "ID requerido")
})

export type CreateOrdenCompraFormData = z.infer<typeof CreateOrdenCompraSchema>
export type UpdateOrdenCompraFormData = z.infer<typeof UpdateOrdenCompraSchema>
