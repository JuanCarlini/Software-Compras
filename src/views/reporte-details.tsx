"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { Separator } from "@/views/ui/separator"
import { 
  Download, 
  RefreshCw, 
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { Reporte, EstadoReporte, TipoReporte, FormatoReporte } from "@/models"
import { useState } from "react"

interface Props {
  reporte: Reporte
  onRegenerar?: () => Promise<void>
  reporteData?: any
}

const getEstadoColor = (estado: EstadoReporte) => {
  switch (estado) {
    case EstadoReporte.COMPLETADO:
      return "bg-green-100 text-green-800"
    case EstadoReporte.GENERANDO:
      return "bg-yellow-100 text-yellow-800"
    case EstadoReporte.PENDIENTE:
      return "bg-blue-100 text-blue-800"
    case EstadoReporte.ERROR:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: EstadoReporte) => {
  switch (estado) {
    case EstadoReporte.COMPLETADO:
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case EstadoReporte.GENERANDO:
      return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
    case EstadoReporte.PENDIENTE:
      return <Clock className="h-5 w-5 text-blue-600" />
    case EstadoReporte.ERROR:
      return <XCircle className="h-5 w-5 text-red-600" />
    default:
      return <FileText className="h-5 w-5 text-gray-600" />
  }
}

const getTipoColor = (tipo: TipoReporte) => {
  const colors = {
    [TipoReporte.ORDENES_COMPRA]: "bg-blue-100 text-blue-800",
    [TipoReporte.ORDENES_PAGO]: "bg-purple-100 text-purple-800",
    [TipoReporte.PROVEEDORES]: "bg-green-100 text-green-800",
    [TipoReporte.PRODUCTOS]: "bg-orange-100 text-orange-800",
    [TipoReporte.FINANCIERO]: "bg-red-100 text-red-800",
    [TipoReporte.INVENTARIO]: "bg-cyan-100 text-cyan-800"
  }
  return colors[tipo] || "bg-gray-100 text-gray-800"
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const formatParametros = (parametros: any) => {
  const entries = Object.entries(parametros).filter(([key, value]) => value !== undefined && value !== null)
  
  return entries.map(([key, value]) => {
    let displayKey = key
    let displayValue = value

    // Formatear claves
    switch (key) {
      case 'fecha_inicio':
        displayKey = 'Fecha de Inicio'
        displayValue = new Date(value as string).toLocaleDateString('es-AR')
        break
      case 'fecha_fin':
        displayKey = 'Fecha de Fin'
        displayValue = new Date(value as string).toLocaleDateString('es-AR')
        break
      case 'incluir_totales':
        displayKey = 'Incluir Totales'
        displayValue = value ? 'Sí' : 'No'
        break
      case 'proveedor_id':
        displayKey = 'Proveedor'
        displayValue = `ID: ${value}`
        break
      case 'estado_orden':
        displayKey = 'Estado de Orden'
        break
      default:
        displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return { key: displayKey, value: displayValue }
  })
}

const renderReporteData = (tipo: TipoReporte, data: any) => {
  if (!data) return null

  switch (tipo) {
    case TipoReporte.ORDENES_COMPRA:
      return (
        <div className="space-y-4">
          <h4 className="font-medium">Resumen de Órdenes de Compra</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{data.total_ordenes}</p>
              <p className="text-sm text-blue-800">Total Órdenes</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">${data.monto_total?.toLocaleString()}</p>
              <p className="text-sm text-green-800">Monto Total</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">${data.promedio_orden?.toLocaleString()}</p>
              <p className="text-sm text-purple-800">Promedio por Orden</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{data.ordenes_por_estado?.pendiente || 0}</p>
              <p className="text-sm text-orange-800">Pendientes</p>
            </div>
          </div>
          
          {data.ordenes_por_estado && (
            <div>
              <h5 className="font-medium mb-2">Distribución por Estado</h5>
              <div className="space-y-2">
                {Object.entries(data.ordenes_por_estado).map(([estado, cantidad]) => (
                  <div key={estado} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="capitalize">{estado.replace('_', ' ')}</span>
                    <span className="font-medium">{cantidad as number} órdenes</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )

    case TipoReporte.PROVEEDORES:
      return (
        <div className="space-y-4">
          <h4 className="font-medium">Análisis de Proveedores</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{data.total_proveedores}</p>
              <p className="text-sm text-blue-800">Total Proveedores</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{data.proveedores_activos}</p>
              <p className="text-sm text-green-800">Activos</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{data.proveedores_suspendidos}</p>
              <p className="text-sm text-red-800">Suspendidos</p>
            </div>
          </div>
          
          {data.top_proveedores && (
            <div>
              <h5 className="font-medium mb-2">Mejores Proveedores</h5>
              <div className="space-y-2">
                {data.top_proveedores.map((prov: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{prov.nombre}</p>
                      <p className="text-sm text-gray-600">{prov.total_ordenes} órdenes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${prov.monto_total?.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total facturado</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )

    case TipoReporte.FINANCIERO:
      return (
        <div className="space-y-4">
          <h4 className="font-medium">Resumen Financiero</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">${data.ingresos_totales?.toLocaleString()}</p>
              <p className="text-sm text-green-800">Ingresos Totales</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">${data.gastos_totales?.toLocaleString()}</p>
              <p className="text-sm text-red-800">Gastos Totales</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">${data.utilidad_neta?.toLocaleString()}</p>
              <p className="text-sm text-blue-800">Utilidad Neta</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-600">{data.margen_utilidad?.toFixed(1)}%</p>
              <p className="text-sm text-purple-800">Margen de Utilidad</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-xl font-bold text-orange-600">${data.cuentas_por_pagar?.toLocaleString()}</p>
              <p className="text-sm text-orange-800">Cuentas por Pagar</p>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <p className="text-xl font-bold text-cyan-600">${data.cuentas_por_cobrar?.toLocaleString()}</p>
              <p className="text-sm text-cyan-800">Cuentas por Cobrar</p>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-center p-8 text-gray-500">
          <p>Vista previa no disponible para este tipo de reporte</p>
        </div>
      )
  }
}

export function ReporteDetails({ reporte, onRegenerar, reporteData }: Props) {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleDownload = () => {
    if (!reporte.resultado_url) return
    window.open(reporte.resultado_url, '_blank')
  }

  const handleRegenerar = async () => {
    if (!onRegenerar) return
    try {
      setIsRegenerating(true)
      await onRegenerar()
    } catch (error) {
      console.error("Error al regenerar reporte:", error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const parametrosFormateados = formatParametros(reporte.parametros)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reportes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{reporte.nombre}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getTipoColor(reporte.tipo)}>
                {reporte.tipo}
              </Badge>
              <Badge className={getEstadoColor(reporte.estado)}>
                <div className="flex items-center space-x-1">
                  {getEstadoIcon(reporte.estado)}
                  <span>{reporte.estado}</span>
                </div>
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {reporte.estado === EstadoReporte.COMPLETADO && reporte.resultado_url && (
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descargar {reporte.formato}
            </Button>
          )}
          
          {(reporte.estado === EstadoReporte.ERROR || reporte.estado === EstadoReporte.COMPLETADO) && (
            <Button 
              variant="outline"
              onClick={handleRegenerar}
              disabled={isRegenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Información del Reporte</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Nombre</p>
                  <p className="text-slate-900">{reporte.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Tipo</p>
                  <Badge className={getTipoColor(reporte.tipo)}>
                    {reporte.tipo}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Formato</p>
                  <p className="text-slate-900">{reporte.formato}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Estado</p>
                  <Badge className={getEstadoColor(reporte.estado)}>
                    {reporte.estado}
                  </Badge>
                </div>
              </div>
              
              {reporte.descripcion && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Descripción</p>
                  <p className="text-slate-700">{reporte.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parámetros del Reporte */}
          {parametrosFormateados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Parámetros</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parametrosFormateados.map((param, index) => (
                    <div key={index}>
                      <p className="text-sm font-medium text-slate-700">{param.key}</p>
                      <p className="text-slate-900">{param.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Datos del Reporte */}
          {reporteData && (
            <Card>
              <CardHeader>
                <CardTitle>Datos del Reporte</CardTitle>
              </CardHeader>
              <CardContent>
                {renderReporteData(reporte.tipo, reporteData)}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Información del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Fecha de Creación</p>
                <p className="text-sm text-slate-600">{formatDate(reporte.created_at)}</p>
              </div>
              
              {reporte.fecha_generacion && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Fecha de Generación</p>
                    <p className="text-sm text-slate-600">{formatDate(reporte.fecha_generacion)}</p>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-slate-700">Última Actualización</p>
                <p className="text-sm text-slate-600">{formatDate(reporte.updated_at)}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-slate-700">Generado por</p>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-600" />
                  <p className="text-sm text-slate-600">{reporte.generado_por}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado del Reporte */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  {getEstadoIcon(reporte.estado)}
                </div>
                <p className="font-medium">{reporte.estado}</p>
                
                {reporte.estado === EstadoReporte.COMPLETADO && (
                  <p className="text-sm text-green-600">
                    El reporte se ha generado exitosamente y está listo para descargar.
                  </p>
                )}
                
                {reporte.estado === EstadoReporte.GENERANDO && (
                  <p className="text-sm text-yellow-600">
                    El reporte se está generando. Esto puede tomar unos minutos.
                  </p>
                )}
                
                {reporte.estado === EstadoReporte.ERROR && (
                  <p className="text-sm text-red-600">
                    Ocurrió un error al generar el reporte. Puedes intentar regenerarlo.
                  </p>
                )}
                
                {reporte.estado === EstadoReporte.PENDIENTE && (
                  <p className="text-sm text-blue-600">
                    El reporte está en cola para ser procesado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
              Descargar {reporte.formato}
            </Button>
          )}
          
          {(reporte.estado === EstadoReporte.ERROR || reporte.estado === EstadoReporte.COMPLETADO) && (
            <Button 
              variant="outline"
              onClick={handleRegenerar}
              disabled={isRegenerating}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerar
            </Button>
          )}
        </div>
      </div>

      {/* Información del Reporte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Información del Reporte</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Nombre</p>
              <p className="text-slate-900">{reporte.nombre}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Tipo</p>
              <p className="text-slate-900">{reporte.tipo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Formato</p>
              <p className="text-slate-900">{reporte.formato}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Estado</p>
              <p className="text-slate-900">{reporte.estado}</p>
            </div>
          </div>
          
          {reporte.descripcion && (
            <div>
              <p className="text-sm font-medium text-slate-700">Descripción</p>
              <p className="text-slate-700">{reporte.descripcion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Información del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Fecha de Creación</p>
            <p className="text-sm text-slate-600">{new Date(reporte.created_at).toLocaleString('es-AR')}</p>
          </div>
          
          {reporte.fecha_generacion && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-slate-700">Fecha de Generación</p>
                <p className="text-sm text-slate-600">{new Date(reporte.fecha_generacion).toLocaleString('es-AR')}</p>
              </div>
            </>
          )}
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium text-slate-700">Última Actualización</p>
            <p className="text-sm text-slate-600">{new Date(reporte.updated_at).toLocaleString('es-AR')}</p>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium text-slate-700">Generado por</p>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-slate-600" />
              <p className="text-sm text-slate-600">{reporte.generado_por}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado del Reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Estado Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <p className="font-medium">{reporte.estado}</p>
            
            {reporte.estado === EstadoReporte.COMPLETADO && (
              <p className="text-sm text-green-600">
                El reporte se ha generado exitosamente y está listo para descargar.
              </p>
            )}
            
            {reporte.estado === EstadoReporte.GENERANDO && (
              <p className="text-sm text-yellow-600">
                El reporte se está generando. Esto puede tomar unos minutos.
              </p>
            )}
            
            {reporte.estado === EstadoReporte.ERROR && (
              <p className="text-sm text-red-600">
                Ocurrió un error al generar el reporte. Puedes intentar regenerarlo.
              </p>
            )}
            
            {reporte.estado === EstadoReporte.PENDIENTE && (
              <p className="text-sm text-blue-600">
                El reporte está en cola para ser procesado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
