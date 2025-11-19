"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { 
  Download, 
  Eye, 
  RefreshCw, 
  Trash2, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Reporte, EstadoReporte, TipoReporte, FormatoReporte } from "@/models"
import { StatusBadge } from "@/shared/status-badge"

// 🔹 Datos de ejemplo (mock)
const placeholderReportes: Reporte[] = [
  {
    id: "1",
    nombre: "Reporte Mensual Compras Enero 2025",
    descripcion: "Órdenes de compra del mes de enero",
    tipo: TipoReporte.ORDENES_COMPRA,
    formato: FormatoReporte.PDF,
    estado: EstadoReporte.COMPLETADO,
    creado_por: "Juan Admin",
    generado_por: "Juan Admin",
    created_at: new Date("2025-01-31T10:30:00Z"),
    updated_at: new Date("2025-01-31T11:00:00Z"),
    fecha_generacion: new Date("2025-01-31T11:00:00Z"),
    resultado_url: "#",
    parametros: { fecha_inicio: "2025-01-01", fecha_fin: "2025-01-31" }
  },
  {
    id: "2",
    nombre: "Top Proveedores Febrero",
    descripcion: "Ranking de proveedores por monto total",
    tipo: TipoReporte.PROVEEDORES,
    formato: FormatoReporte.EXCEL,
    estado: EstadoReporte.GENERANDO,
    creado_por: "María Pérez",
    generado_por: "María Pérez",
    created_at: new Date("2025-02-15T12:00:00Z"),
    updated_at: new Date("2025-02-15T12:10:00Z"),
    fecha_generacion: null,
    resultado_url: null,
    parametros: { incluir_totales: true }
  },
  {
    id: "3",
    nombre: "Informe Financiero Q1",
    descripcion: "Estado financiero del primer trimestre",
    tipo: TipoReporte.FINANCIERO,
    formato: FormatoReporte.CSV,
    estado: EstadoReporte.ERROR,
    creado_por: "Pedro López",
    generado_por: "Pedro López",
    created_at: new Date("2025-03-31T09:00:00Z"),
    updated_at: new Date("2025-03-31T09:30:00Z"),
    fecha_generacion: null,
    resultado_url: null,
    parametros: { incluir_totales: false }
  },
  {
    id: "4",
    nombre: "Reporte de Inventario Marzo",
    descripcion: "Estado del stock al cierre de marzo",
    tipo: TipoReporte.INVENTARIO,
    formato: FormatoReporte.PDF,
    estado: EstadoReporte.PENDIENTE,
    creado_por: "Carla Díaz",
    generado_por: "Carla Díaz",
    created_at: new Date("2025-03-29T14:00:00Z"),
    updated_at: new Date("2025-03-29T14:05:00Z"),
    fecha_generacion: null,
    resultado_url: null,
    parametros: {}
  }
]

// 🔹 Funciones auxiliares
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

const getFormatoIcon = (formato: FormatoReporte) => {
  switch (formato) {
    case FormatoReporte.PDF:
      return "📄"
    case FormatoReporte.EXCEL:
      return "📊"
    case FormatoReporte.CSV:
      return "📋"
    default:
      return "📄"
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// 🔹 Componente principal
export function ReportesList() {
  const [reportes, setReportes] = useState<Reporte[]>(placeholderReportes)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleDownload = (reporte: Reporte) => {
    if (reporte.resultado_url) window.open(reporte.resultado_url, '_blank')
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este reporte?")) return
    setProcessingId(id)
    // Simulamos eliminar
    setTimeout(() => {
      setReportes(prev => prev.filter(r => r.id !== id))
      setProcessingId(null)
    }, 800)
  }

  const handleRegenerar = async (id: string) => {
    setProcessingId(id)
    // Simulamos regeneración
    setTimeout(() => {
      alert(`Reporte ${id} regenerado (simulado)`)
      setProcessingId(null)
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes Generados ({reportes.length})</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {reportes.map((reporte) => (
            <div
              key={reporte.id}
              className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-2xl">
                      {getFormatoIcon(reporte.formato)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">
                        {reporte.nombre}
                      </h3>
                      {reporte.descripcion && (
                        <p className="text-sm text-slate-600 mt-1">
                          {reporte.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getTipoColor(reporte.tipo)}>
                      {reporte.tipo}
                    </Badge>
                    <StatusBadge estado={reporte.estado} showIcon />
                    <span className="text-sm text-slate-500">
                      {reporte.formato}
                    </span>
                  </div>

                  {/* Fechas */}
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>Creado: {formatDate(reporte.created_at)}</p>
                    {reporte.fecha_generacion && (
                      <p>Generado: {formatDate(reporte.fecha_generacion)}</p>
                    )}
                    <p>Por: {reporte.generado_por}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2 ml-4">
                  {reporte.estado === EstadoReporte.COMPLETADO && reporte.resultado_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(reporte)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/reportes/${reporte.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>

                  {(reporte.estado === EstadoReporte.ERROR || reporte.estado === EstadoReporte.COMPLETADO) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerar(reporte.id)}
                      disabled={processingId === reporte.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${processingId === reporte.id ? "animate-spin" : ""}`} />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(reporte.id)}
                    disabled={processingId === reporte.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
