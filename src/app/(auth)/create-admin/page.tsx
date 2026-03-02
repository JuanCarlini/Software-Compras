"use client"

import { useState } from "react"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"

/**
 * PÁGINA TEMPORAL PARA CREAR USUARIO ADMIN
 *
 * Esta página debe ser eliminada después de crear el usuario admin
 * o protegida con algún tipo de autenticación
 */

export default function CreateAdminPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
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
          rol: "admin" // Forzar rol admin
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear usuario admin")
      }

      showSuccessToast(
        "Usuario admin creado exitosamente",
        "Ahora puedes iniciar sesión con las credenciales"
      )

      // Limpiar formulario
      setFormData({
        email: "",
        password: "",
        nombre: "",
        apellido: "",
      })
    } catch (error) {
      console.error("Error:", error)
      showErrorToast(
        "Error al crear usuario admin",
        error instanceof Error ? error.message : "Por favor intenta nuevamente"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">
            ⚠️ Crear Usuario Admin (Temporal)
          </CardTitle>
          <p className="text-center text-sm text-slate-600 mt-2">
            Esta página debe ser eliminada después de crear el admin
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
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <p className="font-semibold text-yellow-800">Nota importante:</p>
              <p className="text-yellow-700">
                Este usuario tendrá rol de <strong>ADMIN</strong> con todos los permisos del sistema.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Creando usuario..." : "Crear Usuario Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
