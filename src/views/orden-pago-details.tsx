"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
// TODO(F6): la OP ahora es borrador -> en_aprobacion -> aprobado -> pagado.
// Los botones de abajo siguen el flujo viejo (pendiente -> aprobado -> pagado):
// hay que rehacerlos contra PATCH /api/ordenes-pago/[id]/estado.
import { OrdenPago } from "@/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Separator } from "@/views/ui/separator"
import { formatDateShort } from "@/shared/date-utils"
import { formatCurrency } from "@/shared/format-utils"
import { StatusBadge } from "@/shared/status-badge"
import { useAuth } from "@/shared/auth-context"
import { canAnularDocumento, stringToUserRole } from "@/shared/permissions"
import { showErrorToast } from "@/shared/toast-helpers"
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
  const { user } = useAuth()
  const [orden, setOrden] = useState<OrdenPago | null>(null)
  const [proveedor, setProveedor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Verificar permisos
  const userRole = user ? stringToUserRole(user.rol) : null
  const canModify = userRole ? canAnularDocumento(userRole) : false

  useEffect(() => {
    const fetchOrden = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/ordenes-pago/${id}`)
        if (!res.ok) {
          setError("Orden no encontrada")
          setOrden(null)
        } else {
          const data = await res.json()
          setOrden(data)

          // Cargar proveedor
          if (data.proveedor_id) {
            const provRes = await fetch(`/api/proveedores/${data.proveedor_id}`)
            setProveedor(provRes.ok ? await provRes.json() : null)
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

  // Transición de estado por la ruta propia. El gate fn_op_gate (Σcajas=Σfacturas=total,
  // cajas misma moneda) se aplica al mandar a aprobar y devuelve 422 con su mensaje.
  const cambiarEstado = async (nuevoEstado: string) => {
    if (!orden) return
    setProcessing(true)
    try {
      const res = await fetch(`/api/ordenes-pago/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cambiar el estado")
      setOrden(data)
    } catch (error) {
      showErrorToast(
        "No se pudo cambiar el estado",
        error instanceof Error ? error.message : "Error desconocido"
      )
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando detalles de la orden de pago...</p>
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
              <p className="text-lg font-mono text-muted-foreground mt-1">{orden.numero_op}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Monto Total</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(orden.total_a_pagar)}
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
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Información del Proveedor
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proveedor:</span>
                    <span className="font-medium">{proveedor?.nombre || `ID: ${orden.proveedor_id}`}</span>
                  </div>
                  {proveedor?.cuit && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CUIT:</span>
                      <span className="font-medium">{proveedor.cuit}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Fechas
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de Orden:</span>
                    <span className="font-medium">{formatDateShort(orden.fecha_op)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creado:</span>
                    <span className="font-medium">
                      {orden.created_at ? formatDateShort(orden.created_at) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Detalles del Pago
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total a Pagar:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(orden.total_a_pagar)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado:</span>
                    <StatusBadge estado={orden.estado} showIcon />
                  </div>
                </div>
              </div>

              {orden.observaciones && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Observaciones
                    </h3>
                    <p className="text-sm text-foreground pl-6 bg-muted p-3 rounded-md">
                      {orden.observaciones}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones según el estado. El circuito no saltea etapas:
          borrador -> en_aprobacion (aplica fn_op_gate) -> aprobado -> pagado. */}
      {orden.estado === "borrador" && (
        <Card>
          <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={() => cambiarEstado("en_aprobacion")} disabled={processing} className="w-full">
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Mandar a aprobar
            </Button>
          </CardContent>
        </Card>
      )}

      {canModify && orden.estado === "en_aprobacion" && (
        <Card>
          <CardHeader><CardTitle>Aprobación</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={() => cambiarEstado("aprobado")} disabled={processing} className="flex-1">
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Aprobar
              </Button>
              <Button variant="destructive" onClick={() => cambiarEstado("rechazado")} disabled={processing} className="flex-1">
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canModify && orden.estado === "aprobado" && (
        <Card>
          <CardHeader><CardTitle>Marcar como pagada</CardTitle></CardHeader>
          <CardContent>
            <Button onClick={() => cambiarEstado("pagado")} disabled={processing} className="w-full" size="lg">
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Confirmar pago realizado
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
