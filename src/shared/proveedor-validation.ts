import { z } from "zod"
import { EstadoProveedor } from "@/models"

// Alineado con el modelo real (gu_proveedores + proveedor-form.tsx): nombre, cuit,
// email, telefono, direccion. El schema viejo (rut/ciudad/pais/contacto_principal/…)
// describía columnas inexistentes y nunca se usaba — se reemplaza por la forma real.
export const CreateProveedorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cuit: z.string().min(1, "El CUIT es requerido"),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  telefono: z.string().or(z.literal("")).optional(),
  direccion: z.string().or(z.literal("")).optional()
})

export const UpdateProveedorSchema = CreateProveedorSchema.partial().extend({
  estado: z.nativeEnum(EstadoProveedor).optional()
})

export const ProveedorParamsSchema = z.object({
  id: z.string().min(1, "ID requerido")
})

export type CreateProveedorFormData = z.infer<typeof CreateProveedorSchema>
export type UpdateProveedorFormData = z.infer<typeof UpdateProveedorSchema>
