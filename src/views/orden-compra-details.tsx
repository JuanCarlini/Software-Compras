"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Button } from "@/views/ui/button"
import { formatCurrency } from "@/shared/format-utils"
import { formatDateShort } from "@/shared/date-utils"
import { OrdenCompra, EstadoOrdenCompra } from "@/models"

interface Props {
  id: string
}

export function OrdenCompraDetails({ id }: Props) {
  const [orden, setOrden] = useState<OrdenCompra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockOrden: OrdenCompra = {
        id,
        numero: `OC-2025-${id}`,
        proveedor_id: "1",
        proveedor_nombre: "ABC Corporation",
        fecha_creacion: new Date("2025-01-15"),
        fecha_entrega: new Date("2025-01-25"),
        descripcion: "Compra de materiales de oficina",
        subtotal: 5000,
        impuestos: 250,
        total: 5250,
        estado: EstadoOrdenCompra.PENDIENTE,
        items: [
          {
            id: "1",
            orden_compra_id: id,
            producto: "Papel A4",
            descripcion: "Resma de papel blanco",
            cantidad: 20,
            precio_unitario: 15,
            subtotal: 300
          },
          {
            id: "2", 
            orden_compra_id: id,
            producto: "Bolígrafos",
            descripcion: "Caja de bolígrafos azules",
            cantidad: 10,
            precio_unitario: 25,
            subtotal: 250
          }
        ],
        created_at: new Date("2025-01-15"),
        updated_at: new Date("2025-01-15")
      }
      setOrden(mockOrden)
      setLoading(false)
    }, 500)
  }, [id])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Cargando detalles de la orden...
        </CardContent>
      </Card>
    )
  }

  if (!orden) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Orden no encontrada
        </CardContent>
      </Card>
    )
  }

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
              <h3 className="font-medium text-gray-900 mb-3">Resumen Financiero</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(orden.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos:</span>
                  <span>{formatCurrency(orden.impuestos)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(orden.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items de la Orden</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orden.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="font-medium">{item.producto}</div>
                    <div className="text-sm text-gray-600">{item.descripcion}</div>
                  </div>
                  <div className="text-sm">
                    <div>Cantidad: {item.cantidad}</div>
                  </div>
                  <div className="text-sm">
                    <div>Precio Unit: {formatCurrency(item.precio_unitario)}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Subtotal: {formatCurrency(item.subtotal)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {orden.estado === EstadoOrdenCompra.PENDIENTE && (
        <div className="flex gap-4">
          <Button className="bg-green-600 hover:bg-green-700">
            Aprobar Orden
          </Button>
          <Button variant="destructive">
            Rechazar Orden
          </Button>
        </div>
      )}
    </div>
  )
}
