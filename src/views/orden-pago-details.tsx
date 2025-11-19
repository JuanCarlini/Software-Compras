"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { OrdenPago, EstadoOrdenPago } from "@/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Separator } from "@/views/ui/separator"
import { formatDateShort } from "@/shared/date-utils"
import { formatCurrency } from "@/shared/format-utils"
import { StatusBadge } from "@/shared/status-badge"
import { OrdenPagoService, ProveedorService } from "@/controllers"
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Calendar,
  User,
  FileText
} from "lucide-react"

export function OrdenPagoDetails() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [orden, setOrden] = useState<OrdenPago | null>(null)
  const [proveedor, setProveedor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        setLoading(true)
        const data = await OrdenPagoService.getById(Number(id))
        if (!data) {
          setError("Orden no encontrada")
          setOrden(null)
        } else {
          setOrden(data)
          
          // Cargar proveedor
          if (data.proveedor_id) {
            const prov = await ProveedorService.getById(data.proveedor_id)
            setProveedor(prov)
          }
          
          setError(null)
        }
      } catch (error) {
        console.error('Error cargando orden:', error)
        setError("Error al cargar la orden")
        setOrden(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrden()
    }
  }, [id])

  const handleAprobar = async () => {
    if (!orden) return
    setProcessing(true)
    try {
      const updated = await OrdenPagoService.update(Number(id), { estado: 'aprobado' })
      if (updated) {
        setOrden(updated)
      }
    } catch (error) {
      console.error("Error al aprobar:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleRechazar = async () => {
    if (!orden) return
    setProcessing(true)
    try {
      const updated = await OrdenPagoService.update(Number(id), { estado: 'rechazado' })
      if (updated) {
        setOrden(updated)
      }
    } catch (error) {
      console.error("Error al rechazar:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleMarcarPagada = async () => {
    if (!orden) return
    setProcessing(true)
    try {
      const updated = await OrdenPagoService.update(Number(id), { estado: 'pagado' })
      if (updated) {
        setOrden(updated)
      }
    } catch (error) {
      console.error("Error al marcar como pagada:", error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalles de la orden de pago...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !orden) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-600">{error || "Orden no encontrada"}</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <StatusBadge estado={orden.estado} showIcon />
        </div>
      </div>

      {/* Información Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Orden de Pago</CardTitle>
              <p className="text-lg font-mono text-slate-600 mt-1">{orden.numero_op}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Monto Total</p>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(orden.total_pago)}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Información del Proveedor
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Proveedor:</span>
                    <span className="font-medium">{proveedor?.nombre || `ID: ${orden.proveedor_id}`}</span>
                  </div>
                  {proveedor?.cuit && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">CUIT:</span>
                      <span className="font-medium">{proveedor.cuit}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Fechas
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fecha de Orden:</span>
                    <span className="font-medium">{formatDateShort(orden.fecha_op)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Creado:</span>
                    <span className="font-medium">{formatDateShort(orden.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Detalles del Pago
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total a Pagar:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(orden.total_pago)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estado:</span>
                    <StatusBadge estado={orden.estado} showIcon />
                  </div>
                </div>
              </div>

              {orden.observaciones && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Observaciones
                    </h3>
                    <p className="text-sm text-slate-700 pl-6 bg-slate-50 p-3 rounded-md">
                      {orden.observaciones}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      {orden.estado === EstadoOrdenPago.PENDIENTE && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                onClick={handleAprobar}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Aprobar Orden
              </Button>
              <Button
                variant="destructive"
                onClick={handleRechazar}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Rechazar Orden
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {orden.estado === EstadoOrdenPago.APROBADO && (
        <Card>
          <CardHeader>
            <CardTitle>Marcar como Pagada</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleMarcarPagada}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" />
              )}
              Confirmar Pago Realizado
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
