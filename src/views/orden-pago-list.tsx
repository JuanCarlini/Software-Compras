"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { SearchBar } from "@/views/ui/search-bar"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/views/ui/dialog"
import { Eye, CheckCircle, XCircle, Loader2, DollarSign } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useOrdensPago } from "@/shared/use-ordenes-pago"
import { formatCurrency } from "@/shared/format-utils"
import { formatDateShort } from "@/shared/date-utils"
import { searchWithScore } from "@/shared/search-utils"
import { StatusBadge } from "@/shared/status-badge"
import { useAuth } from "@/shared/auth-context"
import { canAnularDocumento, stringToUserRole } from "@/shared/permissions"

export function OrdenPagoList() {
  const { orders, loading, error, aprobarOrder, pagarOrder, rechazarOrder } = useOrdensPago()
  const { user } = useAuth()
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [pagoDialog, setPagoDialog] = useState<number | null>(null)
  const [referenciaBancaria, setReferenciaBancaria] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Verificar permisos
  const userRole = user ? stringToUserRole(user.rol) : null
  const canModify = userRole ? canAnularDocumento(userRole) : false

  // Filtrar órdenes basado en la búsqueda
  const filteredOrders = searchWithScore(
    orders,
    searchTerm,
    ['numero_op', 'proveedor_nombre', 'estado'],
    {
      numero_op: 3,         // Mayor peso para número de orden
      proveedor_nombre: 2,  // Peso medio para proveedor
      estado: 2             // Peso medio para estado
    }
  )

  const handleAprobar = async (id: number) => {
    try {
      setProcessingId(id)
      await aprobarOrder(id)
    } catch (error) {
      console.error("Error al aprobar orden:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handlePagar = async (id: number) => {
    if (!referenciaBancaria.trim()) {
      alert("La referencia bancaria es requerida")
      return
    }
    
    try {
      setProcessingId(id)
      await pagarOrder(id, referenciaBancaria)
      setPagoDialog(null)
      setReferenciaBancaria("")
    } catch (error) {
      console.error("Error al registrar pago:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRechazar = async (id: number) => {
    try {
      setProcessingId(id)
      await rechazarOrder(id)
    } catch (error) {
      console.error("Error al rechazar orden:", error)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando órdenes de pago...</span>
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
          <CardTitle>Lista de Órdenes de Pago ({filteredOrders.length})</CardTitle>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por número, proveedor, método..."
            className="w-80"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {searchTerm 
                  ? `No se encontraron órdenes que coincidan con "${searchTerm}"`
                  : "No hay órdenes de pago registradas"
                }
              </p>
            </div>
          ) : (
            filteredOrders.map((orden) => (
              <div 
                key={orden.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="font-medium text-slate-900">Orden #{orden.numero_op}</p>
                    <p className="text-sm text-slate-500">{formatDateShort(orden.fecha_op)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">{orden.proveedor_nombre}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(orden.total_a_pagar)}</p>
                  </div>
                  <div>
                    <StatusBadge estado={orden.estado} showIcon />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/ordenes-pago/${orden.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    {canModify && orden.estado === "borrador" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAprobar(orden.id)}
                        disabled={processingId === orden.id}
                      >
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}

                    {canModify && orden.estado === "aprobado" && (
                      <Dialog 
                        open={pagoDialog === orden.id} 
                        onOpenChange={(open) => {
                          if (open) {
                            setPagoDialog(orden.id)
                          } else {
                            setPagoDialog(null)
                            setReferenciaBancaria("")
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={processingId === orden.id}
                          >
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrar Pago</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="referencia">Referencia Bancaria</Label>
                              <Input
                                id="referencia"
                                value={referenciaBancaria}
                                onChange={(e) => setReferenciaBancaria(e.target.value)}
                                placeholder="TRF-20250115-001"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => handlePagar(orden.id)}
                                disabled={processingId === orden.id || !referenciaBancaria.trim()}
                              >
                                {processingId === orden.id ? "Procesando..." : "Registrar Pago"}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setPagoDialog(null)
                                  setReferenciaBancaria("")
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {canModify && (orden.estado === "borrador" ||
                      orden.estado === "aprobado") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRechazar(orden.id)}
                        disabled={processingId === orden.id}
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
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
