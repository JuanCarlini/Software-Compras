import { z } from "zod"
import { UserRole } from "@/models"

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
})

export const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  rol: z.nativeEnum(UserRole)
})

export type LoginFormData = z.infer<typeof LoginSchema>
export type RegisterFormData = z.infer<typeof RegisterSchema>
