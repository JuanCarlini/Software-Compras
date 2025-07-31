"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { MetodoPago } from "@/models"

const proveedores = [
  { id: "1", nombre: "ABC Corporation" },
  { id: "2", nombre: "XYZ Supplies Ltd" },
  { id: "3", nombre: "Tech Solutions Inc" },
  { id: "4", nombre: "Global Materials" }
]

const ordenesCompra = [
  { id: "001", numero: "OC-2025-001", proveedor: "ABC Corporation", total: 5250 },
  { id: "002", numero: "OC-2025-002", proveedor: "XYZ Supplies Ltd", total: 8750 },
  { id: "003", numero: "OC-2025-003", proveedor: "Tech Solutions Inc", total: 12400 }
]

export function OrdenPagoForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrdenCompra, setSelectedOrdenCompra] = useState("")
  const [monto, setMonto] = useState("")
  const router = useRouter()

  const handleOrdenCompraChange = (ordenId: string) => {
    setSelectedOrdenCompra(ordenId)
    const orden = ordenesCompra.find(o => o.id === ordenId)
    if (orden) {
      setMonto(orden.total.toString())
    }
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="orden-compra">Orden de Compra</Label>
              <Select onValueChange={handleOrdenCompraChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una orden de compra" />
                </SelectTrigger>
                <SelectContent>
                  {ordenesCompra.map((orden) => (
                    <SelectItem key={orden.id} value={orden.id}>
                      {orden.numero} - {orden.proveedor} - ${orden.total.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto a Pagar</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select defaultValue="ARS" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                  <SelectItem value="USD">USD - Dólar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha-vencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fecha-vencimiento"
                type="date"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo-pago">Método de Pago</Label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MetodoPago.TRANSFERENCIA}>
                  Transferencia Bancaria
                </SelectItem>
                <SelectItem value={MetodoPago.CHEQUE}>
                  Cheque
                </SelectItem>
                <SelectItem value={MetodoPago.EFECTIVO}>
                  Efectivo
                </SelectItem>
                <SelectItem value={MetodoPago.TARJETA}>
                  Tarjeta de Crédito
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              placeholder="Notas adicionales sobre el pago..."
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Orden de Pago"}
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
