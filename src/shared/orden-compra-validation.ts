import { z } from "zod"
import { ESTADOS_APROBACION, MONEDAS } from "@/models/enums"

// Línea de OC: elige un item del catálogo. Sin orden_compra_id (lo asigna el service)
// y sin totales (los calcula el server con shared/totales.ts).
export const CreateOrdenCompraLineaSchema = z.object({
  item_id: z.number().int().positive("El item es requerido"),
  descripcion: z.string().optional(),
  cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario_neto: z.number().min(0).optional(), // ausente = heredar el del proveedor
  iva_porcentaje: z.number().min(0).max(100).optional(),
})

// numero_oc lo genera la DB (fn_num_oc); `estado` lo fija el server en 'borrador' (S2);
// los totales los calcula el server desde las líneas. Nada de eso se acepta del cliente.
export const CreateOrdenCompraSchema = z.object({
  proveedor_id: z.number().int().positive("El proveedor es requerido"),
  proyecto_id: z.number().int().positive().nullish(),
  fecha_oc: z.string().min(1, "La fecha es requerida"), // YYYY-MM-DD
  moneda: z.enum(MONEDAS).optional(),
  tarea: z.string().nullish(),
  observaciones: z.string().nullish(),
  lineas: z.array(CreateOrdenCompraLineaSchema).optional(),
})

// El update es solo de cabecera: las líneas tienen sus propias rutas.
// TODO(F3): sacar 'estado' de acá cuando exista PATCH /api/ordenes-compra/[id]/estado.
// Se mantiene mientras tanto porque Zod descarta las claves desconocidas en silencio:
// quitarlo antes de tener la ruta nueva rompería "aprobar" sin devolver ningún error.
export const UpdateOrdenCompraSchema = CreateOrdenCompraSchema
  .omit({ lineas: true })
  .partial()
  .extend({ estado: z.enum(ESTADOS_APROBACION).optional() })

// Body de la transición de estado.
export const CambiarEstadoOCSchema = z.object({ estado: z.enum(ESTADOS_APROBACION) })

export type CreateOrdenCompraFormData = z.infer<typeof CreateOrdenCompraSchema>
export type UpdateOrdenCompraFormData = z.infer<typeof UpdateOrdenCompraSchema>
