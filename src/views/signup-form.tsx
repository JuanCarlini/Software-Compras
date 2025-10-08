"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"
import { UserRole } from "@/models"

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellido: "",
    rol: UserRole.USUARIO
  })
  const router = useRouter()

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Validación de contraseñas
      if (formData.password !== formData.confirmPassword) {
        showErrorToast("Error de validación", "Las contraseñas no coinciden")
        return
      }

      if (formData.password.length < 6) {
        showErrorToast("Error de validación", "La contraseña debe tener al menos 6 caracteres")
        return
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          apellido: formData.apellido,
          rol: formData.rol
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear cuenta")
      }

      showSuccessToast(
        "Cuenta creada exitosamente", 
        "Ahora puedes iniciar sesión con tus credenciales"
      )
      
      // Redirigir al login después de 1.5 segundos
      setTimeout(() => {
        router.push("/login")
      }, 1500)
      
    } catch (error) {
      console.error("Error en registro:", error)
      showErrorToast(
        "Error al crear cuenta", 
        error instanceof Error ? error.message : "Por favor intenta nuevamente"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Crear Cuenta</CardTitle>
        <p className="text-center text-sm text-slate-600 mt-2">
          Completa los datos para registrarte
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Juan"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                type="text"
                placeholder="Pérez"
                value={formData.apellido}
                onChange={(e) => handleChange("apellido", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select 
              value={formData.rol} 
              onValueChange={(value) => handleChange("rol", value)}
            >
              <SelectTrigger id="rol">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.USUARIO}>Usuario</SelectItem>
                <SelectItem value={UserRole.SUPERVISOR}>Supervisor</SelectItem>
                <SelectItem value={UserRole.READONLY}>Solo Lectura</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-slate-600">¿Ya tienes cuenta? </span>
            <Link 
              href="/login" 
              className="text-slate-900 font-medium hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
