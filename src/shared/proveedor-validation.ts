import { z } from "zod"
import { EstadoProveedor } from "@/models"

export const CreateProveedorSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  rut: z.string().min(8, "El RUT debe ser válido").regex(/^\d{8,11}-[\dK]$/, "Formato de RUT inválido"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(8, "Teléfono debe tener al menos 8 caracteres"),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: z.string().min(2, "La ciudad es requerida"),
  pais: z.string().min(2, "El país es requerido"),
  contacto_principal: z.string().min(2, "El contacto principal es requerido"),
  sitio_web: z.string().url("URL inválida").optional().or(z.literal("")),
  notas: z.string().optional()
})

export const UpdateProveedorSchema = CreateProveedorSchema.partial().extend({
  estado: z.nativeEnum(EstadoProveedor).optional()
})

export const ProveedorParamsSchema = z.object({
  id: z.string().min(1, "ID requerido")
})

export type CreateProveedorFormData = z.infer<typeof CreateProveedorSchema>
export type UpdateProveedorFormData = z.infer<typeof UpdateProveedorSchema>
