"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { Loader2, DollarSign, Calendar, Building2 } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"

export function OrdenPagoForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facturas, setFacturas] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const router = useRouter()

  const [formData, setFormData] = useState({
    factura_id: "",
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: "transferencia",
    referencia: "",
    observaciones: "",
  })

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null)

  useEffect(() => {
    fetchFacturas()
  }, [])

  const fetchFacturas = async () => {
    try {
      setLoadingData(true)
      const response = await fetch('/api/facturas')
      if (!response.ok) throw new Error('Error al cargar facturas')
      const data = await response.json()
      
      // Filtrar solo facturas aprobadas
      const facturasAprobadas = data.filter((f: any) => f.estado === 'aprobado')
      setFacturas(facturasAprobadas)
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setError("No se pudieron cargar los datos")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (formData.factura_id) {
      const factura = facturas.find((f: any) => String(f.id) === formData.factura_id)
      setFacturaSeleccionada(factura)
    }
  }, [formData.factura_id, facturas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.factura_id) {
      setError("Por favor selecciona una factura")
      return
    }

    if (!facturaSeleccionada) {
      setError("Factura no encontrada")
      return
    }

    try {
      setIsLoading(true)

      const pagoData = {
        proveedor_id: facturaSeleccionada.proveedor_id,
        fecha_op: formData.fecha_pago,
        total_pago: facturaSeleccionada.total_con_iva,
        estado: "pendiente",
        observaciones: formData.observaciones || null,
        lineas: [{
          factura_id: parseInt(formData.factura_id),
          concepto: `Pago de ${facturaSeleccionada.numero_factura}`,
          monto: facturaSeleccionada.total_con_iva,
          forma_pago: formData.metodo_pago
        }]
      }

      const response = await fetch('/api/ordenes-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoData)
      })

      if (!response.ok) throw new Error('Error al crear orden de pago')
      
      showSuccessToast("Éxito", "Orden de pago creada correctamente")
      router.push("/ordenes-pago")
    } catch (err) {
      console.error("Error:", err)
      setError("Error al crear la orden de pago")
      showErrorToast("Error", "No se pudo crear la orden de pago")
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva Orden de Pago</CardTitle>
        <p className="text-sm text-slate-600 mt-2">
          Crear una orden de pago para una factura aprobada
        </p>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Factura *</Label>
            <Select
              required
              disabled={isLoading || facturas.length === 0}
              value={formData.factura_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, factura_id: value }))}
            >
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    facturas.length === 0 
                      ? "No hay facturas aprobadas" 
                      : "Selecciona una factura"
                  } 
                />
              </SelectTrigger>
              <SelectContent>
                {facturas.map((factura: any) => (
                  <SelectItem key={factura.id} value={String(factura.id)}>
                    {factura.numero_factura} - {factura.proveedor_nombre} - ${factura.total_con_iva?.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {facturaSeleccionada && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Proveedor:</strong> {facturaSeleccionada.proveedor_nombre}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Monto a pagar:</strong> ${facturaSeleccionada.total_con_iva?.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha de Pago *
              </Label>
              <Input
                type="date"
                required
                disabled={isLoading}
                value={formData.fecha_pago}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_pago: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Método de Pago *</Label>
              <Select
                required
                disabled={isLoading}
                value={formData.metodo_pago}
                onValueChange={(value) => setFormData(prev => ({ ...prev, metodo_pago: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="retencion">Retención</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Referencia / Número de Operación</Label>
            <Input
              placeholder="Ej: Transferencia #123456, Cheque #789"
              disabled={isLoading}
              value={formData.referencia}
              onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción / Observaciones</Label>
            <Textarea
              placeholder="Observaciones adicionales sobre el pago..."
              rows={3}
              disabled={isLoading}
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            />
          </div>

          {facturaSeleccionada && (
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h3 className="font-medium mb-3">Resumen del Pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Factura:</span>
                  <span className="font-medium">{facturaSeleccionada.numero_factura}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Proveedor:</span>
                  <span className="font-medium">{facturaSeleccionada.proveedor_nombre}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-slate-600">Monto Total:</span>
                  <span className="text-lg font-bold text-green-600">
                    <DollarSign className="inline h-4 w-4" />
                    ${facturaSeleccionada.total_con_iva?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={isLoading || !facturaSeleccionada || facturas.length === 0}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Procesando..." : "Registrar Pago"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/ordenes-pago")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
