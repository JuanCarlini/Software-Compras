"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/views/ui/dialog"
import { CheckCircle, XCircle, DollarSign, Calendar, User, FileText } from "lucide-react"
import { formatCurrency } from "@/shared/format-utils"
import { formatDateShort } from "@/shared/date-utils"
import { OrdenPago, EstadoOrdenPago, MetodoPago } from "@/models"

interface Props {
  id: string
}

export function OrdenPagoDetails({ id }: Props) {
  const [orden, setOrden] = useState<OrdenPago | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState(false)
  const [pagoDialog, setPagoDialog] = useState(false)
  const [referenciaBancaria, setReferenciaBancaria] = useState("")

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const mockOrden: OrdenPago = {
        id,
        numero: `OP-2025-${id}`,
        orden_compra_id: "001",
        proveedor_id: "1",
        proveedor_nombre: "ABC Corporation",
        fecha_creacion: new Date("2025-01-16"),
        fecha_vencimiento: new Date("2025-01-31"),
        monto: 5250,
        moneda: "ARS",
        estado: EstadoOrdenPago.APROBADA,
        metodo_pago: MetodoPago.TRANSFERENCIA,
        observaciones: "Pago de orden de compra OC-2025-001 - Materiales de oficina",
        created_at: new Date("2025-01-16"),
        updated_at: new Date("2025-01-16")
      }
      setOrden(mockOrden)
      setLoading(false)
    }, 500)
  }, [id])

  const handleAprobar = async () => {
    setProcessingAction(true)
    // Simular API call
    setTimeout(() => {
      if (orden) {
        setOrden({ ...orden, estado: EstadoOrdenPago.APROBADA })
      }
      setProcessingAction(false)
    }, 1000)
  }

  const handlePagar = async () => {
    if (!referenciaBancaria.trim()) {
      alert("La referencia bancaria es requerida")
      return
    }
    
    setProcessingAction(true)
    // Simular API call
    setTimeout(() => {
      if (orden) {
        setOrden({ 
          ...orden, 
          estado: EstadoOrdenPago.PAGADA, 
          referencia_bancaria: referenciaBancaria 
        })
      }
      setPagoDialog(false)
      setReferenciaBancaria("")
      setProcessingAction(false)
    }, 1000)
  }

  const handleRechazar = async () => {
    setProcessingAction(true)
    // Simular API call
    setTimeout(() => {
      if (orden) {
        setOrden({ ...orden, estado: EstadoOrdenPago.RECHAZADA })
      }
      setProcessingAction(false)
    }, 1000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Cargando detalles de la orden de pago...
        </CardContent>
      </Card>
    )
  }

  if (!orden) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          Orden de pago no encontrada
        </CardContent>
      </Card>
    )
  }

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Información General
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orden de Compra:</span>
                    <span className="font-medium">OC-2025-{orden.orden_compra_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha Creación:</span>
                    <span>{formatDateShort(orden.fecha_creacion)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha Vencimiento:</span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDateShort(orden.fecha_vencimiento)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de Pago:</span>
                    <span>{orden.metodo_pago}</span>
                  </div>
                  {orden.referencia_bancaria && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referencia:</span>
                      <span className="font-mono text-sm">{orden.referencia_bancaria}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Proveedor
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{orden.proveedor_nombre}</p>
                  <p className="text-sm text-gray-600">ID: {orden.proveedor_id}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Información Financiera
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Monto a Pagar</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {formatCurrency(orden.monto)}
                    </p>
                    <p className="text-sm text-gray-600">{orden.moneda}</p>
                  </div>
                </div>
              </div>

              {orden.observaciones && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Observaciones</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{orden.observaciones}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      {(orden.estado === EstadoOrdenPago.PENDIENTE || 
        orden.estado === EstadoOrdenPago.APROBADA) && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {orden.estado === EstadoOrdenPago.PENDIENTE && (
                <Button 
                  onClick={handleAprobar}
                  disabled={processingAction}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processingAction ? "Procesando..." : "Aprobar Orden"}
                </Button>
              )}

              {orden.estado === EstadoOrdenPago.APROBADA && (
                <Dialog open={pagoDialog} onOpenChange={setPagoDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={processingAction}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Registrar Pago
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
                          onClick={handlePagar}
                          disabled={processingAction || !referenciaBancaria.trim()}
                        >
                          {processingAction ? "Procesando..." : "Confirmar Pago"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setPagoDialog(false)
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

              <Button 
                variant="destructive"
                onClick={handleRechazar}
                disabled={processingAction}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {processingAction ? "Procesando..." : "Rechazar Orden"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
