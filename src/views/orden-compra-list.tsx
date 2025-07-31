"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useOrders } from "@/shared/use-orders"
import { formatCurrency } from "@/shared/format-utils"
import { formatDateShort } from "@/shared/date-utils"
import { EstadoOrdenCompra } from "@/models"

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

export function OrdenCompraList() {
  const { orders, loading, error, updateOrder } = useOrders()

  const handleAprobar = async (id: string) => {
    try {
      await updateOrder(id, { estado: EstadoOrdenCompra.APROBADA })
    } catch (error) {
      console.error("Error al aprobar orden:", error)
    }
  }

  const handleRechazar = async (id: string) => {
    try {
      await updateOrder(id, { estado: EstadoOrdenCompra.RECHAZADA })
    } catch (error) {
      console.error("Error al rechazar orden:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando órdenes...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Órdenes de Compra ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No hay órdenes de compra registradas
            </p>
          ) : (
            orders.map((orden) => (
              <div 
                key={orden.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium text-slate-900">Orden #{orden.numero}</p>
                    <p className="text-sm text-slate-500">{formatDateShort(orden.fecha_creacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">{orden.proveedor_nombre}</p>
                    <p className="text-sm text-slate-500">{orden.items.length} items</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(orden.total)}</p>
                    <Badge className={getEstadoColor(orden.estado)}>
                      {orden.estado}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/ordenes-compra/${orden.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {orden.estado === EstadoOrdenCompra.PENDIENTE && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAprobar(orden.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRechazar(orden.id)}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
