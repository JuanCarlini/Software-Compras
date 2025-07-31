"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/views/ui/dialog"
import { Eye, CheckCircle, XCircle, Loader2, CreditCard, DollarSign } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useOrdensPago } from "@/shared/use-ordenes-pago"
import { formatCurrency } from "@/shared/format-utils"
import { formatDateShort } from "@/shared/date-utils"
import { EstadoOrdenPago, MetodoPago } from "@/models"

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

const getMetodoPagoIcon = (metodo: MetodoPago) => {
  switch (metodo) {
    case MetodoPago.TRANSFERENCIA:
      return <CreditCard className="h-4 w-4" />
    case MetodoPago.CHEQUE:
      return <DollarSign className="h-4 w-4" />
    case MetodoPago.EFECTIVO:
      return <DollarSign className="h-4 w-4" />
    case MetodoPago.TARJETA:
      return <CreditCard className="h-4 w-4" />
    default:
      return <DollarSign className="h-4 w-4" />
  }
}

export function OrdenPagoList() {
  const { orders, loading, error, aprobarOrder, pagarOrder, rechazarOrder } = useOrdensPago()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [pagoDialog, setPagoDialog] = useState<string | null>(null)
  const [referenciaBancaria, setReferenciaBancaria] = useState("")

  const handleAprobar = async (id: string) => {
    try {
      setProcessingId(id)
      await aprobarOrder(id)
    } catch (error) {
      console.error("Error al aprobar orden:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handlePagar = async (id: string) => {
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

  const handleRechazar = async (id: string) => {
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
        <CardTitle>Lista de Órdenes de Pago ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              No hay órdenes de pago registradas
            </p>
          ) : (
            orders.map((orden) => (
              <div 
                key={orden.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="font-medium text-slate-900">Orden #{orden.numero}</p>
                    <p className="text-sm text-slate-500">{formatDateShort(orden.fecha_creacion)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">{orden.proveedor_nombre}</p>
                    <p className="text-xs text-slate-500">OC: {orden.orden_compra_id}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{formatCurrency(orden.monto)}</p>
                    <div className="flex items-center text-xs text-slate-500">
                      {getMetodoPagoIcon(orden.metodo_pago)}
                      <span className="ml-1">{orden.metodo_pago}</span>
                    </div>
                  </div>
                  <div>
                    <Badge className={getEstadoColor(orden.estado)}>
                      {orden.estado}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      Vence: {formatDateShort(orden.fecha_vencimiento)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/ordenes-pago/${orden.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    {orden.estado === EstadoOrdenPago.PENDIENTE && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAprobar(orden.id)}
                        disabled={processingId === orden.id}
                      >
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    
                    {orden.estado === EstadoOrdenPago.APROBADA && (
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
                    
                    {(orden.estado === EstadoOrdenPago.PENDIENTE || 
                      orden.estado === EstadoOrdenPago.APROBADA) && (
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
