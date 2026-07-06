import { z } from "zod"
import type { OcEstado } from "@/models"

// Valores de public.oc_estado en la DB (mantener en sync con OcEstado)
const OC_ESTADOS = ["borrador", "en_aprobacion", "aprobado", "rechazado", "anulado"] as const satisfies readonly OcEstado[]

// Línea de OC (sin orden_compra_id: lo asigna el service al crear la cabecera)
export const CreateOrdenCompraLineaSchema = z.object({
  item_id: z.number().int().positive().nullable().optional(),
  item_codigo: z.string().nullable().optional(),
  descripcion: z.string().min(1, "La descripción de la línea es requerida"),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario_neto: z.number().min(0),
  iva_porcentaje: z.number().min(0),
  total_neto: z.number().min(0),
  total_con_iva: z.number().min(0),
  estado: z.string().nullable().optional()
})

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
  // S2: 'estado' NO se acepta al crear — el server lo fija en 'borrador'. Zod descarta la clave si el cliente la manda.
  observaciones: z.string().nullable().optional(),
  lineas: z.array(CreateOrdenCompraLineaSchema).optional()
})

// El update es solo de cabecera: las líneas tienen sus propias rutas.
// 'estado' se re-agrega acá porque el PUT sí transiciona estados (aprobar/anular), gateado por rol en la ruta.
export const UpdateOrdenCompraSchema = CreateOrdenCompraSchema
  .omit({ lineas: true })
  .partial()
  .extend({ estado: z.enum(OC_ESTADOS).optional() })

export const OrdenCompraParamsSchema = z.object({
  id: z.string().min(1, "ID requerido")
})

export type CreateOrdenCompraFormData = z.infer<typeof CreateOrdenCompraSchema>
export type UpdateOrdenCompraFormData = z.infer<typeof UpdateOrdenCompraSchema>
