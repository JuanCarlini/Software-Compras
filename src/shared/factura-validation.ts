import { z } from "zod"

// Línea de factura (alineada con gu_lineasdefactura).
// 'estado' se omite a propósito: Zod descarta la clave y la DB usa su default 'borrador' (S2).
export const CreateFacturaLineaSchema = z.object({
  descripcion: z.string().min(1, "La descripción de la línea es requerida"),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.number().min(0),
  iva_porcentaje: z.number().min(0),
  total_neto: z.number().min(0),
  total_con_iva: z.number().min(0),
})

// Alineado con gu_facturas + el payload de factura-form.tsx.
// 'estado' y 'numero_factura' NO se aceptan del cliente: los fija el server (S2).
// 'lineas' y 'certificaciones_ids' se incluyen sí o sí: Zod descarta lo no declarado,
// y el controller los consume (crea líneas + asocia certificaciones).
export const CreateFacturaSchema = z.object({
  proveedor_id: z.number().int().positive("El proveedor es requerido"),
  fecha_factura: z.string().min(1, "La fecha es requerida"),
  total_neto: z.number().min(0),
  total_iva: z.number().min(0),
  total_con_iva: z.number().min(0),
  lineas: z.array(CreateFacturaLineaSchema).min(1, "Debe haber al menos una línea"),
  certificaciones_ids: z.array(z.number().int().positive()).optional().default([]),
})

export type CreateFacturaFormData = z.infer<typeof CreateFacturaSchema>
