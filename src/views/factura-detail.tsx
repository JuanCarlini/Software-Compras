"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { ArrowLeft, Building2, Calendar, FileCheck } from "lucide-react"
import { showErrorToast } from "@/shared/toast-helpers"

interface Props {
  params: Promise<{ id: string }>
}

export function FacturaDetail({ params }: Props) {
  const { id } = use(params)
  const [factura, setFactura] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFactura = async () => {
      try {
        const response = await fetch(`/api/facturas/${id}`)
        if (!response.ok) throw new Error("Error al cargar factura")
        const data = await response.json()
        setFactura(data)
      } catch (error) {
        showErrorToast("Error", "No se pudo cargar la factura")
      } finally {
        setLoading(false)
      }
    }

    fetchFactura()
  }, [id])

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      borrador: { variant: "secondary", label: "Borrador" },
      aprobado: { variant: "default", label: "Aprobado" },
      rechazado: { variant: "destructive", label: "Rechazado" },
      anulado: { variant: "outline", label: "Anulado" }
    }
    
    const config = variants[estado] || variants.borrador
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) return <div className="text-center py-8">Cargando...</div>
  if (!factura) return <div className="text-center py-8">Factura no encontrada</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/facturas")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl mb-2">
                {factura.numero_factura}
              </CardTitle>
              {getEstadoBadge(factura.estado)}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                $
                {Number(factura.total_con_iva ?? 0).toLocaleString("es-AR", {
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
                  <div className="text-sm text-slate-600">Proveedor</div>
                  <div className="font-semibold">{factura.proveedor_nombre ?? "—"}</div>
                  {factura.proveedor_cuit && (
                    <Badge variant="outline" className="mt-1">
                      CUIT: {factura.proveedor_cuit}
                    </Badge>
                  )}
                  {factura.proveedor_email && (
                    <div className="text-sm text-slate-600 mt-1">{factura.proveedor_email}</div>
                  )}
                  {factura.proveedor_direccion && (
                    <div className="text-sm text-slate-600">{factura.proveedor_direccion}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm text-slate-600">Fecha de Factura</div>
                  <div className="font-semibold">
                    {new Date(factura.fecha_factura).toLocaleDateString("es-AR")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Resumen Financiero</h3>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal (Neto)</span>
                <span className="font-semibold">
                  ${Number(factura.total_neto ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">IVA</span>
                <span className="font-semibold">
                  ${Number(factura.total_iva ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total con IVA</span>
                <span className="text-green-600">
                  ${Number(factura.total_con_iva ?? 0).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {factura.certificaciones && factura.certificaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Certificaciones Asociadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {factura.certificaciones.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => router.push(`/certificaciones/${cert.id}`)}
                >
                  <div>
                    <div className="font-semibold">{cert.numero_cert}</div>
                    <div className="text-sm text-slate-600">
                      Fecha: {new Date(cert.fecha_cert).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge>Aprobado</Badge>
                    <div className="text-sm font-medium mt-1">
                      ${Number(cert.total_con_iva ?? 0).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Líneas de la Factura</CardTitle>
        </CardHeader>
        <CardContent>
          {!factura.lineas || factura.lineas.length === 0 ? (
            <p className="text-slate-600">No hay líneas registradas</p>
          ) : (
            <div className="space-y-4">
              {factura.lineas.map((linea: any, index: number) => (
                <div key={linea.id ?? index} className="border rounded-lg p-4 bg-slate-50">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-2">
                      <div className="text-sm text-slate-600">Descripción</div>
                      <div className="font-medium">{linea.descripcion}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Cantidad</div>
                      <div className="font-medium">{linea.cantidad}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Precio Unitario</div>
                      <div className="font-medium">
                        ${Number(linea.precio_unitario ?? 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Total</div>
                      <div className="font-bold text-green-600">
                        ${Number(linea.total_con_iva ?? 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-xs text-slate-600">IVA: {linea.iva_porcentaje}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
