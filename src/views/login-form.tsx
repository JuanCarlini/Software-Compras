"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

      // Guardar token temporalmente (TODO: implementar storage seguro)
      if (data.token) {
        localStorage.setItem("auth-token", data.token)
        localStorage.setItem("user-data", JSON.stringify(data.user))
      }
      
      showSuccessToast("Sesión iniciada correctamente", `Bienvenido ${data.user.nombre}`)
      router.push("/dashboard")
    } catch (error) {
      console.error("Error en login:", error)
      showErrorToast(
        "Error al iniciar sesión", 
        error instanceof Error ? error.message : "Verifica tus credenciales"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Iniciar Sesión</CardTitle>
        <div className="text-center text-sm text-gray-600 mt-2">
          <p className="font-medium">Credenciales válidas:</p>
          <div className="mt-1 space-y-1">
            <p><code className="bg-gray-100 px-1 rounded">admin@gestion.com</code> / <code className="bg-gray-100 px-1 rounded">admin123</code></p>
            <p><code className="bg-gray-100 px-1 rounded">usuario@gestion.com</code> / <code className="bg-gray-100 px-1 rounded">user123</code></p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
