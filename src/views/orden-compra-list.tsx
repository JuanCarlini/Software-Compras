"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { SearchBar } from "@/views/ui/search-bar"
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useOrders } from "@/shared/use-orders"
import { formatCurrency } from "@/shared/format-utils"
import { SearchStats } from "@/views/ui/search-stats"
import { searchWithScore } from "@/shared/search-utils"
import { showErrorToast } from "@/shared/toast-helpers"
import { StatusBadge } from "@/shared/status-badge"

export function OrdenCompraList() {
  const { orders, loading, error, updateOrder } = useOrders()
  const [searchTerm, setSearchTerm] = useState("")
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // ⚠️ ahora buscamos por los campos que realmente tenemos
  const filteredOrders = searchWithScore(
    orders,
    searchTerm,
    ["numero_oc", "estado", "observaciones"],
    {
      numero_oc: 3,
      estado: 2,
      observaciones: 1,
    }
  )

  const handleAprobar = async (id: number | string) => {
    try {
      setUpdatingId(Number(id))
      await updateOrder(id, { estado: "aprobado" })
    } catch (error) {
      console.error("Error al aprobar orden:", error)
      showErrorToast("Error al aprobar", error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAnular = async (id: number | string) => {
    try {
      setUpdatingId(Number(id))
      await updateOrder(id, { estado: "anulado" })
    } catch (error) {
      console.error("Error al anular orden:", error)
      showErrorToast("Error al anular", error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setUpdatingId(null)
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
        <div className="flex items-center justify-between">
          <CardTitle>Órdenes de Compra ({filteredOrders.length})</CardTitle>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por número, estado u observación..."
            className="w-80"
          />
        </div>
      </CardHeader>
      <CardContent>
        <SearchStats
          totalItems={orders.length}
          filteredItems={filteredOrders.length}
          searchTerm={searchTerm}
          entityName="orden"
        />

        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {searchTerm
                  ? `No se encontraron órdenes que coincidan con "${searchTerm}"`
                  : "No hay órdenes de compra registradas"}
              </p>
            </div>
          ) : (
            filteredOrders.map((orden: any) => (
              <div
                key={orden.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* columna 1: número y fecha */}
                  <div>
                    <p className="font-medium text-slate-900">
                      {orden.numero_oc ? `OC #${orden.numero_oc}` : `OC ID ${orden.id}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {/* en la tabla la fecha es fecha_oc (date), no fecha_creacion */}
                      {orden.fecha_oc
                        ? new Date(orden.fecha_oc).toLocaleDateString("es-AR")
                        : ""}
                    </p>
                  </div>

                  {/* columna 2: proveedor (solo tenemos id) */}
                  <div>
                    <p className="text-sm text-slate-900">
                      {orden.proveedor_nombre ||
                        (orden.proveedor_id ? `Proveedor #${orden.proveedor_id}` : "Sin proveedor")}
                    </p>
                    {orden.observaciones && (
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {orden.observaciones}
                      </p>
                    )}
                  </div>

                  {/* columna 3: totales y estado */}
                  <div>
                    <p className="font-medium text-slate-900">
                      {formatCurrency(orden.total_con_iva ?? orden.total_neto ?? 0)}
                    </p>
                    <StatusBadge estado={orden.estado} showIcon />
                  </div>

                  {/* columna 4: acciones */}
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/ordenes-compra/${orden.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    {/* solo si está en borrador la dejamos aprobar/anular */}
                    {orden.estado === "borrador" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAprobar(orden.id)}
                          disabled={updatingId === orden.id}
                        >
                          {updatingId === orden.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnular(orden.id)}
                          disabled={updatingId === orden.id}
                        >
                          {updatingId === orden.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
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
