"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { OrdenPago, EstadoOrdenPago, MetodoPago } from "@/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Button } from "@/views/ui/button"
import { formatDateShort } from "@/shared/date-utils"
import { formatCurrency } from "@/shared/format-utils"

export function OrdenPagoDetails() {
  const params = useParams()
  const id = params.id as string
  const [orden, setOrden] = useState<OrdenPago | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        const response = await fetch(`/api/ordenes-pago/${id}`)
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
          <p className="mt-4 text-gray-600">Cargando detalles de la orden de pago...</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Base de datos no configurada</h3>
          <p className="text-gray-600 mb-4">
            Configure la conexión a base de datos para ver los detalles de las órdenes de pago.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  // TODO: Implementar funciones cuando se tenga BD real
  const getEstadoColor = (estado: EstadoOrdenPago) => {
    switch (estado) {
      case EstadoOrdenPago.PAGADA:
        return "bg-green-100 text-green-800"
      case EstadoOrdenPago.APROBADA:
        return "bg-blue-100 text-blue-800"
      case EstadoOrdenPago.PENDIENTE:
        return "bg-yellow-100 text-yellow-800"
      case EstadoOrdenPago.RECHAZADA:
        return "bg-red-100 text-red-800"
      case EstadoOrdenPago.VENCIDA:
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMetodoIcon = (metodo: MetodoPago) => {
    switch (metodo) {
      case MetodoPago.TRANSFERENCIA:
        return "🏦"
      case MetodoPago.CHEQUE:
        return "📝"
      case MetodoPago.EFECTIVO:
        return "💵"
      case MetodoPago.TARJETA:
        return "💳"
      default:
        return "💰"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orden de Pago {orden.numero}</CardTitle>
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
                <div><span className="font-medium">Orden de Compra:</span> {orden.orden_compra_id}</div>
                <div><span className="font-medium">Fecha Creación:</span> {formatDateShort(orden.fecha_creacion)}</div>
                <div><span className="font-medium">Fecha Vencimiento:</span> {formatDateShort(orden.fecha_vencimiento)}</div>
                <div>
                  <span className="font-medium">Método de Pago:</span> 
                  <span className="ml-2">
                    {getMetodoIcon(orden.metodo_pago)} {orden.metodo_pago}
                  </span>
                </div>
                {orden.referencia_bancaria && (
                  <div><span className="font-medium">Referencia:</span> {orden.referencia_bancaria}</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Monto</h3>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(orden.monto)}
                </div>
                <div className="text-sm text-gray-600">
                  {orden.moneda}
                </div>
              </div>
            </div>
          </div>

          {orden.observaciones && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium text-gray-900 mb-2">Observaciones</h3>
              <p className="text-sm text-gray-600">{orden.observaciones}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones disponibles según el estado */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Las acciones estarán disponibles cuando se configure la base de datos.
            </p>
            <div className="space-x-2">
              <Button variant="outline" disabled>Aprobar</Button>
              <Button variant="outline" disabled>Rechazar</Button>
              <Button variant="outline" disabled>Marcar como Pagada</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
