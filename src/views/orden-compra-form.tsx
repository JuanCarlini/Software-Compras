"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"

const proveedores = [
  { id: "1", nombre: "ABC Corporation" },
  { id: "2", nombre: "XYZ Supplies Ltd" },
  { id: "3", nombre: "Tech Solutions Inc" },
  { id: "4", nombre: "Global Materials" }
]

export function OrdenCompraForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    setTimeout(() => {
      setIsLoading(false)
      router.push("/ordenes-compra")
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Orden</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Select required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Entrega</Label>
              <Input id="fecha" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe los productos o servicios..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input id="subtotal" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="impuestos">Impuestos</Label>
              <Input id="impuestos" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Total</Label>
              <Input id="total" type="number" step="0.01" placeholder="0.00" readOnly />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Orden"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/ordenes-compra")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
