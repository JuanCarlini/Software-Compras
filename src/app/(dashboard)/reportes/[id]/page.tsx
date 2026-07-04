"use client"

import { useState } from "react"
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

// 🔹 Utilidades para colores e íconos
const getEstadoColor = (estado: EstadoReporte) => {
  switch (estado) {
    case EstadoReporte.COMPLETADO: return "bg-green-100 text-green-800"
    case EstadoReporte.GENERANDO:  return "bg-yellow-100 text-yellow-800"
    case EstadoReporte.PENDIENTE:  return "bg-blue-100 text-blue-800"
    case EstadoReporte.ERROR:      return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

const getEstadoIcon = (estado: EstadoReporte) => {
  switch (estado) {
    case EstadoReporte.COMPLETADO: return <CheckCircle className="h-5 w-5 text-green-600" />
    case EstadoReporte.GENERANDO:  return <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
    case EstadoReporte.PENDIENTE:  return <Clock className="h-5 w-5 text-blue-600" />
    case EstadoReporte.ERROR:      return <XCircle className="h-5 w-5 text-red-600" />
    default: return <FileText className="h-5 w-5 text-gray-600" />
  }
}

const getTipoColor = (tipo: TipoReporte) => {
  const colors = {
    [TipoReporte.ORDENES_COMPRA]: "bg-blue-100 text-blue-800",
    [TipoReporte.ORDENES_PAGO]:   "bg-purple-100 text-purple-800",
    [TipoReporte.PROVEEDORES]:    "bg-green-100 text-green-800",
    [TipoReporte.PRODUCTOS]:      "bg-orange-100 text-orange-800",
    [TipoReporte.FINANCIERO]:     "bg-red-100 text-red-800",
    [TipoReporte.INVENTARIO]:     "bg-cyan-100 text-cyan-800"
  }
  return colors[tipo] || "bg-gray-100 text-gray-800"
}

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date))

const formatParametros = (parametros: any) => {
  if (!parametros) return []
  return Object.entries(parametros).map(([k, v]) => ({
    key: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: String(v)
  }))
}

// 🔹 Datos ficticios
const mockReporte: Reporte = {
  id: "mock-001",
  nombre: "Reporte de Órdenes de Compra - Q3",
  descripcion: "Resumen trimestral de órdenes de compra y estados",
  tipo: TipoReporte.ORDENES_COMPRA,
  formato: FormatoReporte.PDF,
  estado: EstadoReporte.COMPLETADO,
  parametros: {
    fecha_inicio: "2025-07-01",
    fecha_fin: "2025-09-30",
    incluir_totales: true,
    estado_orden: "Aprobada"
  },
  creado_por: "admin",
  generado_por: "Juan Carlini",
  created_at: new Date("2025-09-30T10:00:00"),
  updated_at: new Date("2025-10-05T14:30:00"),
  fecha_generacion: new Date("2025-10-01T12:00:00"),
  resultado_url: "/mock/reportes/oc-q3.pdf"
}

const mockData = {
  total_ordenes: 85,
  monto_total: 2534000,
  promedio_orden: 29812,
  ordenes_por_estado: {
    aprobada: 60,
    pendiente: 15,
    rechazada: 10
  }
}

// 🔹 Componente principal
export default function ReporteDetails() {
  const [reporte] = useState<Reporte>(mockReporte)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleDownload = () => window.alert(`📥 Simulando descarga de ${reporte.nombre}`)
  const handleRegenerar = () => {
    setIsRegenerating(true)
    setTimeout(() => {
      alert("✅ Reporte regenerado con éxito (mock)")
      setIsRegenerating(false)
    }, 1500)
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
              <Badge className={getTipoColor(reporte.tipo)}>{reporte.tipo}</Badge>
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
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> Descargar
          </Button>
          <Button variant="outline" onClick={handleRegenerar} disabled={isRegenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
            Regenerar
          </Button>
        </div>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Reporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p><strong>Formato:</strong> {reporte.formato}</p>
              <p>{reporte.descripcion}</p>
            </CardContent>
          </Card>

          {parametrosFormateados.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Parámetros</CardTitle></CardHeader>
              <CardContent>
                {parametrosFormateados.map((p, i) => (
                  <p key={i}><strong>{p.key}:</strong> {p.value}</p>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Datos del Reporte</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{mockData.total_ordenes}</p>
                  <p className="text-sm">Total Órdenes</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">${mockData.monto_total.toLocaleString()}</p>
                  <p className="text-sm">Monto Total</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">${mockData.promedio_orden.toLocaleString()}</p>
                  <p className="text-sm">Promedio por Orden</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{mockData.ordenes_por_estado.pendiente}</p>
                  <p className="text-sm">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Fechas</CardTitle></CardHeader>
            <CardContent>
              <p><strong>Creado:</strong> {formatDate(reporte.created_at)}</p>
              <p><strong>Generado:</strong> {formatDate(reporte.fecha_generacion!)}</p>
              <p><strong>Actualizado:</strong> {formatDate(reporte.updated_at)}</p>
              <p><strong>Generado por:</strong> {reporte.generado_por}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Estado Actual</CardTitle></CardHeader>
            <CardContent className="text-center space-y-2">
              {getEstadoIcon(reporte.estado)}
              <p className="font-medium">{reporte.estado}</p>
              <p className="text-sm text-green-600">Datos cargados de forma ficticia</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
