"use client"

import { useState, useEffect } from "react"
import { OrdenCompraService, ProveedorService } from "@/controllers"
import { Card, CardContent } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Loader2 } from "lucide-react"
import { formatCurrency } from "@/shared/format-utils"
import { formatDateShort } from "@/shared/date-utils"
import { StatusBadge } from "@/shared/status-badge"

interface Props {
  ordenId: string
}

export function OrdenCompraDetails({ ordenId }: Props) {
  const [orden, setOrden] = useState<any>(null)
  const [lineas, setLineas] = useState<any[]>([])
  const [proveedor, setProveedor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1) cabecera
        const oc = await OrdenCompraService.getById(Number(ordenId))
        if (!oc) {
          setError("Orden no encontrada")
          setOrden(null)
          setLineas([])
          return
        }
        setOrden(oc)

        // 2) proveedor
        if (oc.proveedor_id) {
          const prov = await ProveedorService.getById(oc.proveedor_id)
          setProveedor(prov)
        } else {
          setProveedor(null)
        }

        // 3) líneas
        const rows = await OrdenCompraService.getLinesByOrdenId(Number(ordenId))
        setLineas(rows)
      } catch (err) {
        console.error("Error cargando orden:", err)
        setError("Error al cargar la orden")
        setOrden(null)
        setLineas([])
      } finally {
        setLoading(false)
      }
    }

    if (ordenId) {
      fetchData()
    }
  }, [ordenId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles de la orden...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !orden) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Orden no encontrada"}
          </h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información de esta orden.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Orden de Compra {orden.numero_oc ?? `#${orden.id}`}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Fecha: {orden.fecha_oc ? formatDateShort(orden.fecha_oc) : "—"}
            </p>
          </div>
          <StatusBadge estado={orden.estado} showIcon />
        </div>

        {/* 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {/* info general */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Información General
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600">Proveedor:</p>
                <p className="text-base text-slate-900">
                  {proveedor?.nombre ??
                    (orden.proveedor_id
                      ? `Proveedor #${orden.proveedor_id}`
                      : "—")}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Moneda:</p>
                <p className="text-base text-slate-900">
                  {orden.moneda ?? "ARS"}
                </p>
              </div>
              {orden.observaciones && (
                <div>
                  <p className="text-sm text-slate-600">Observaciones:</p>
                  <p className="text-base text-slate-900 whitespace-pre-wrap">
                    {orden.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* totales */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Totales
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Subtotal:</span>
                <span className="text-base text-slate-900">
                  {formatCurrency(Number(orden.total_neto ?? 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Impuestos:</span>
                <span className="text-base text-slate-900">
                  {formatCurrency(Number(orden.total_iva ?? 0))}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-lg font-bold text-slate-900">Total:</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(Number(orden.total_con_iva ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* líneas */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Items de la Orden ({lineas.length})
          </h3>

          {lineas.length === 0 ? (
            <p className="text-slate-500">Esta orden no tiene líneas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                      Código
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                      P. Unitario
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineas.map((linea) => (
                    <tr key={linea.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">
                          {linea.descripcion}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {linea.item_codigo ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">
                        {Number(linea.cantidad ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">
                        {formatCurrency(Number(linea.precio_unitario_neto ?? 0))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatCurrency(Number(linea.total_neto ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
