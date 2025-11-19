"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { ArrowLeft, FileText, Calendar, Building2, User, Check, X } from "lucide-react"
import { showErrorToast, showSuccessToast } from "@/shared/toast-helpers"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/views/ui/alert-dialog"

interface Props {
  params: Promise<{ id: string }>
}

export function CertificacionDetail({ params }: Props) {
  const { id } = use(params)
  const [cert, setCert] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchCertificacion = async () => {
      try {
        const response = await fetch(`/api/certificaciones/${id}`)
        if (!response.ok) throw new Error("Error al cargar certificación")
        const data = await response.json()
        setCert(data)
      } catch (error) {
        showErrorToast("Error", "No se pudo cargar la certificación")
      } finally {
        setLoading(false)
      }
    }

    fetchCertificacion()
  }, [id])

  const cambiarEstado = async (nuevoEstado: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/certificaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (!response.ok) throw new Error("Error al actualizar estado")

      const data = await response.json()
      setCert(data)
      
      const mensajes: Record<string, string> = {
        aprobado: "Certificación aprobada correctamente",
        rechazado: "Certificación rechazada",
        borrador: "Certificación marcada como borrador"
      }
      
      showSuccessToast("Éxito", mensajes[nuevoEstado] || "Estado actualizado")
      setShowApproveDialog(false)
      setShowRejectDialog(false)
    } catch (error) {
      showErrorToast("Error", "No se pudo actualizar el estado")
    } finally {
      setUpdating(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const e = (estado || "").toLowerCase()
    if (e === "aprobada" || e === "aprobado") {
      return <Badge>Aprobado</Badge>
    }
    if (e === "rechazada" || e === "rechazado") {
      return <Badge variant="destructive">Rechazado</Badge>
    }
    return <Badge variant="secondary">Borrador</Badge>
  }

  if (loading) return <div className="text-center py-8">Cargando...</div>
  if (!cert) return <div className="text-center py-8">Certificación no encontrada</div>

  const puedeAprobar = cert.estado === "borrador"
  const puedeRechazar = cert.estado === "borrador"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/certificaciones")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div className="flex gap-2">
          {puedeAprobar && (
            <Button
              onClick={() => setShowApproveDialog(true)}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Aprobar
            </Button>
          )}
          
          {puedeRechazar && (
            <Button
              onClick={() => setShowRejectDialog(true)}
              disabled={updating}
              variant="destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Rechazar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">
                {cert.numero_cert ?? `CERT-${cert.id}`}
              </CardTitle>
              {getEstadoBadge(cert.estado)}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                $
                {Number(cert.total_con_iva ?? 0).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className="text-sm text-slate-600">Total con IVA</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm text-slate-600">Proyecto</div>
                  <div className="font-semibold">{cert.proyecto_nombre ?? "—"}</div>
                  {cert.proyecto_codigo && (
                    <Badge variant="outline" className="mt-1">
                      {cert.proyecto_codigo}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm text-slate-600">Proveedor</div>
                  <div className="font-semibold">{cert.proveedor_nombre ?? "—"}</div>
                  {cert.proveedor_cuit && (
                    <div className="text-sm text-slate-600">
                      CUIT: {cert.proveedor_cuit}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm text-slate-600">Fecha de Certificación</div>
                  <div className="font-semibold">
                    {cert.fecha_cert
                      ? new Date(cert.fecha_cert).toLocaleDateString("es-AR")
                      : "—"}
                  </div>
                </div>
              </div>

              {cert.observaciones && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-600">Observaciones</div>
                    <div className="text-sm">{cert.observaciones}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Líneas de Certificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cert.lineas?.map((linea: any) => (
              <div key={linea.id} className="border rounded-lg p-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-5">
                    <div className="font-semibold">{linea.descripcion}</div>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="text-sm text-slate-600">Cantidad</div>
                    <div>{Number(linea.cantidad ?? 0)}</div>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="text-sm text-slate-600">Precio Unit.</div>
                    <div>${Number(linea.precio_unitario ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="col-span-1 text-right">
                    <div className="text-sm text-slate-600">IVA</div>
                    <div>{Number(linea.iva_porcentaje ?? 0)}%</div>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="text-sm text-slate-600">Total</div>
                    <div className="font-semibold">
                      ${Number(linea.total_con_iva ?? 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-end space-x-8">
              <div className="text-right">
                <div className="text-sm text-slate-600">Total Neto</div>
                <div className="text-xl font-bold">
                  ${Number(cert.total_neto ?? 0).toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">Total con IVA</div>
                <div className="text-2xl font-bold text-green-600">
                  ${Number(cert.total_con_iva ?? 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Aprobación */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Certificación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas aprobar la certificación {cert.numero_cert}?
              Esta acción permitirá que la certificación sea utilizada en facturas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cambiarEstado("aprobado")}
              disabled={updating}
              className="bg-green-600 hover:bg-green-700"
            >
              {updating ? "Aprobando..." : "Aprobar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Rechazo */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Certificación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas rechazar la certificación {cert.numero_cert}?
              Esta acción cambiará el estado a rechazado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cambiarEstado("rechazado")}
              disabled={updating}
              className="bg-red-600 hover:bg-red-700"
            >
              {updating ? "Rechazando..." : "Rechazar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
