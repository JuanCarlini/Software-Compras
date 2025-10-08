"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { OrdenCompraService, ProveedorService } from "@/controllers"

export function OrdenPagoForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      router.push("/ordenes-pago")
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Orden de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Formulario de orden de pago simplificado
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Crear Orden"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/ordenes-pago")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
