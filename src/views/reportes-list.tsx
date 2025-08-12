"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { Input } from "@/views/ui/input"
import { 
  Download, 
  Eye, 
  RefreshCw, 
  Trash2, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Search
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Reporte, EstadoReporte, TipoReporte, FormatoReporte } from "@/models"

interface Props {
  reportes: Reporte[]
  loading: boolean
  error: string | null
  onDelete: (id: string) => Promise<void>
  onRegenerar: (id: string) => Promise<void>
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
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case EstadoReporte.GENERANDO:
      return <Loader2 className="h-4 w-4 text-yellow-600 animate-spin" />
    case EstadoReporte.PENDIENTE:
      return <Clock className="h-4 w-4 text-blue-600" />
    case EstadoReporte.ERROR:
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <FileText className="h-4 w-4 text-gray-600" />
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

export function ReportesList({ reportes, loading, error, onDelete, onRegenerar }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<TipoReporte | "TODOS">("TODOS")
  const [filterEstado, setFilterEstado] = useState<EstadoReporte | "TODOS">("TODOS")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleDownload = (reporte: Reporte) => {
    if (!reporte.resultado_url) return
    
    // En la vida real, esto haría una descarga real del archivo
    window.open(reporte.resultado_url, '_blank')
  }

  // Primero aplicar filtros básicos
  const basicFilteredReportes = reportes.filter(reporte => {
    const matchesTipo = filterTipo === "TODOS" || reporte.tipo === filterTipo
    const matchesEstado = filterEstado === "TODOS" || reporte.estado === filterEstado
    return matchesTipo && matchesEstado
  })

  // Luego aplicar búsqueda con score
  const filteredReportes = searchWithScore(
    basicFilteredReportes,
    searchTerm,
    ['nombre', 'descripcion', 'tipo', 'formato', 'estado', 'generado_por'],
    {
      nombre: 3,        // Mayor peso para nombre
      tipo: 2,         // Peso medio para tipo
      descripcion: 2,   // Peso medio para descripción
      estado: 1,       // Menor peso para estado
      formato: 1,      // Menor peso para formato
      generado_por: 1  // Menor peso para generado por
    }
  )

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este reporte?")) return
    
    try {
      setProcessingId(id)
      await onDelete(id)
    } catch (error) {
      console.error("Error al eliminar reporte:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleRegenerar = async (id: string) => {
    try {
      setProcessingId(id)
      await onRegenerar(id)
    } catch (error) {
      console.error("Error al regenerar reporte:", error)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando reportes...</span>
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
        <div className="flex items-center justify-between">
          <CardTitle>Reportes Generados ({filteredReportes.length})</CardTitle>
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar reportes por nombre, tipo, estado..."
            className="w-80"
          />
          
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as TipoReporte | "TODOS")}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos los tipos</option>
            {Object.values(TipoReporte).map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as EstadoReporte | "TODOS")}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Todos los estados</option>
            {Object.values(EstadoReporte).map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredReportes.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              {searchTerm || filterTipo !== "TODOS" || filterEstado !== "TODOS" 
                ? "No se encontraron reportes con ese criterio" 
                : "No hay reportes generados"}
            </p>
          ) : (
            filteredReportes.map((reporte) => (
              <div 
                key={reporte.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header del reporte */}
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

                    {/* Badges y metadatos */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getTipoColor(reporte.tipo)}>
                        {reporte.tipo}
                      </Badge>
                      
                      <Badge className={getEstadoColor(reporte.estado)}>
                        <div className="flex items-center space-x-1">
                          {getEstadoIcon(reporte.estado)}
                          <span>{reporte.estado}</span>
                        </div>
                      </Badge>

                      <span className="text-sm text-slate-500">
                        {reporte.formato}
                      </span>
                    </div>

                    {/* Información temporal */}
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
                        <RefreshCw className={`h-4 w-4 ${processingId === reporte.id ? 'animate-spin' : ''}`} />
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
