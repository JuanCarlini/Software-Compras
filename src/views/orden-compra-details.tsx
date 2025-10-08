"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { OrdenCompra, EstadoOrdenCompra } from "@/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Button } from "@/views/ui/button"
import { formatDateShort } from "@/shared/date-utils"
import { formatCurrency } from "@/shared/format-utils"

export function OrdenCompraDetails() {
  const params = useParams()
  const id = params.id as string
  const [orden, setOrden] = useState<OrdenCompra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        const response = await fetch(`/api/ordenes-compra/${id}`)
        if (!response.ok) throw new Error('Orden no encontrada')
        const data = await response.json()
        setOrden(data)
      } catch (error) {
        console.error('Error cargando orden:', error)
        setOrden(null)
      } finally {
        setLoading(false)
      }
    }

    // Llamar a la API real
    fetchOrden()
  }, [id])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
          <p className="mt-4 text-gray-600">Cargando detalles de la orden...</p>
        </CardContent>
      </Card>
    )
  }

  if (!orden) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Base de datos no configurada</h3>
          <p className="text-gray-600 mb-4">
            Configure la conexión a base de datos para ver los detalles de las órdenes.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  // TODO: Implementar funciones cuando se tenga BD real
  const getEstadoColor = (estado: EstadoOrdenCompra) => {
    switch (estado) {
      case EstadoOrdenCompra.APROBADA:
        return "bg-green-100 text-green-800"
      case EstadoOrdenCompra.PENDIENTE:
        return "bg-yellow-100 text-yellow-800"
      case EstadoOrdenCompra.EN_REVISION:
        return "bg-blue-100 text-blue-800"
      case EstadoOrdenCompra.RECHAZADA:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orden {orden.numero}</CardTitle>
            <Badge className={getEstadoColor(orden.estado)}>
              {orden.estado}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Información General</h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Proveedor:</span> {orden.proveedor_nombre}</div>
                <div><span className="font-medium">Fecha Creación:</span> {formatDateShort(orden.fecha_creacion)}</div>
                <div><span className="font-medium">Fecha Entrega:</span> {formatDateShort(orden.fecha_entrega)}</div>
                <div><span className="font-medium">Descripción:</span> {orden.descripcion}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Totales</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orden.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos:</span>
                  <span>{formatCurrency(orden.impuestos)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(orden.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items de la orden */}
      <Card>
        <CardHeader>
          <CardTitle>Items de la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orden.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.producto}</h4>
                    <p className="text-sm text-gray-600">{item.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                    <p className="text-sm text-gray-600">
                      {item.cantidad} × {formatCurrency(item.precio_unitario)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
