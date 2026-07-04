"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Checkbox } from "@/views/ui/checkbox"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { CalendarIcon, Loader2 } from "lucide-react"
import { CreateReporteData, TipoReporte, FormatoReporte } from "@/models"
import { ReporteController } from "@/controllers"

const reporteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.nativeEnum(TipoReporte, { errorMap: () => ({ message: "Selecciona un tipo de reporte" }) }),
  descripcion: z.string().optional(),
  formato: z.nativeEnum(FormatoReporte, { errorMap: () => ({ message: "Selecciona un formato" }) }),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  proveedor_id: z.string().optional(),
  estado_orden: z.string().optional(),
  incluir_totales: z.boolean().default(true)
})

type FormData = z.infer<typeof reporteSchema>

interface Props {
  onSuccess?: (reporte: any) => void
}

export function ReporteForm({ onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      formato: FormatoReporte.PDF,
      incluir_totales: true
    }
  })

  const selectedTipo = form.watch("tipo")

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Construir parámetros del reporte
      const parametros: any = {
        incluir_totales: data.incluir_totales
      }

      if (data.fecha_inicio) parametros.fecha_inicio = new Date(data.fecha_inicio)
      if (data.fecha_fin) parametros.fecha_fin = new Date(data.fecha_fin)
      if (data.proveedor_id) parametros.proveedor_id = data.proveedor_id
      if (data.estado_orden && data.estado_orden !== "TODOS") parametros.estado_orden = data.estado_orden

      const createData: CreateReporteData = {
        nombre: data.nombre,
        tipo: data.tipo,
        descripcion: data.descripcion,
        formato: data.formato,
        parametros
      }

      const newReporte = await ReporteController.create(createData)
      
      if (onSuccess) {
        onSuccess(newReporte)
      } else {
        router.push(`/reportes/${newReporte.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el reporte")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!selectedTipo) return

    try {
      setIsLoading(true)
      const parametros = {
        fecha_inicio: form.getValues("fecha_inicio") ? new Date(form.getValues("fecha_inicio")!) : undefined,
        fecha_fin: form.getValues("fecha_fin") ? new Date(form.getValues("fecha_fin")!) : undefined,
        proveedor_id: form.getValues("proveedor_id"),
        incluir_totales: form.getValues("incluir_totales")
      }
      
      const data = await ReporteController.getReporteData(selectedTipo, parametros)
      setPreviewData(data)
    } catch (err) {
      setError("Error al obtener vista previa")
    } finally {
      setIsLoading(false)
    }
  }

  const renderParametrosEspecificos = () => {
    switch (selectedTipo) {
      case TipoReporte.ORDENES_COMPRA:
      case TipoReporte.ORDENES_PAGO:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  {...form.register("fecha_inicio")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha de Fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  {...form.register("fecha_fin")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado_orden">Estado de Orden (Opcional)</Label>
              <Select onValueChange={(value) => form.setValue("estado_orden", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Aprobada">Aprobada</SelectItem>
                  <SelectItem value="Rechazada">Rechazada</SelectItem>
                  <SelectItem value="Completada">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case TipoReporte.PROVEEDORES:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Período Desde</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  {...form.register("fecha_inicio")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Período Hasta</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  {...form.register("fecha_fin")}
                />
              </div>
            </div>
          </div>
        )

      case TipoReporte.FINANCIERO:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Mes/Año Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  {...form.register("fecha_inicio")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Mes/Año Fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  {...form.register("fecha_fin")}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderPreview = () => {
    if (!previewData) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Vista Previa de Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedTipo === TipoReporte.ORDENES_COMPRA && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{previewData.total_ordenes}</p>
                  <p className="text-sm text-blue-800">Total Órdenes</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">${previewData.monto_total?.toLocaleString()}</p>
                  <p className="text-sm text-green-800">Monto Total</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">${previewData.promedio_orden?.toLocaleString()}</p>
                  <p className="text-sm text-purple-800">Promedio</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{previewData.ordenes_por_estado?.pendiente || 0}</p>
                  <p className="text-sm text-orange-800">Pendientes</p>
                </div>
              </div>
            )}

            {selectedTipo === TipoReporte.PROVEEDORES && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{previewData.total_proveedores}</p>
                    <p className="text-sm text-blue-800">Total Proveedores</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{previewData.proveedores_activos}</p>
                    <p className="text-sm text-green-800">Activos</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{previewData.proveedores_suspendidos}</p>
                    <p className="text-sm text-red-800">Suspendidos</p>
                  </div>
                </div>
                
                {previewData.top_proveedores && (
                  <div>
                    <h4 className="font-medium mb-2">Top Proveedores</h4>
                    <div className="space-y-2">
                      {previewData.top_proveedores.map((prov: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{prov.nombre}</span>
                          <span className="text-sm text-gray-600">{prov.total_ordenes} órdenes - ${prov.monto_total?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTipo === TipoReporte.FINANCIERO && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">${previewData.ingresos_totales?.toLocaleString()}</p>
                  <p className="text-sm text-green-800">Ingresos</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">${previewData.gastos_totales?.toLocaleString()}</p>
                  <p className="text-sm text-red-800">Gastos</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">${previewData.utilidad_neta?.toLocaleString()}</p>
                  <p className="text-sm text-blue-800">Utilidad Neta</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar Nuevo Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Reporte *</Label>
                  <Input
                    id="nombre"
                    {...form.register("nombre")}
                    placeholder="Ej: Reporte Mensual Enero 2025"
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-red-600">{form.formState.errors.nombre.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Reporte *</Label>
                  <Select onValueChange={(value) => form.setValue("tipo", value as TipoReporte)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TipoReporte).map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tipo && (
                    <p className="text-sm text-red-600">{form.formState.errors.tipo.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    {...form.register("descripcion")}
                    placeholder="Descripción opcional del reporte"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formato">Formato *</Label>
                  <Select 
                    value={form.watch("formato")} 
                    onValueChange={(value) => form.setValue("formato", value as FormatoReporte)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(FormatoReporte).map(formato => (
                        <SelectItem key={formato} value={formato}>{formato}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.formato && (
                    <p className="text-sm text-red-600">{form.formState.errors.formato.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Parámetros Específicos */}
            {selectedTipo && (
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Parámetros del Reporte</h3>
                {renderParametrosEspecificos()}
                
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox
                    id="incluir_totales"
                    checked={form.watch("incluir_totales")}
                    onCheckedChange={(checked) => form.setValue("incluir_totales", checked as boolean)}
                  />
                  <Label htmlFor="incluir_totales">Incluir totales y resúmenes</Label>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex gap-4 pt-6 border-t">
              {selectedTipo && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Vista Previa
                </Button>
              )}
              
              <Button type="submit" disabled={isLoading || !selectedTipo}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoading ? "Generando..." : "Generar Reporte"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/reportes")}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {renderPreview()}
    </div>
  )
}
