"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Button } from "@/views/ui/button"
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { EstadisticasReportes } from "@/controllers"

interface Props {
  estadisticas: EstadisticasReportes
}

export function ReportesDashboard({ estadisticas }: Props) {
  return (
    <div className="space-y-6">
      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reportes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total_reportes}</div>
            <p className="text-xs text-muted-foreground">
              Reportes generados en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estadisticas.reportes_completados}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((estadisticas.reportes_completados / estadisticas.total_reportes) * 100)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{estadisticas.reportes_pendientes}</div>
            <p className="text-xs text-muted-foreground">
              En proceso de generación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Error</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estadisticas.reportes_error}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tipos de Reportes Más Generados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Tipos Más Generados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.tipos_mas_generados.map((item, index) => (
                <div key={item.tipo} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.tipo}</p>
                      <p className="text-sm text-slate-600">{item.cantidad} reportes</p>
                    </div>
                  </div>
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(item.cantidad / estadisticas.tipos_mas_generados[0].cantidad) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formatos Preferidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Formatos Preferidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estadisticas.formatos_preferidos.map((item, index) => {
                const percentage = Math.round((item.cantidad / estadisticas.total_reportes) * 100)
                const colorClasses = {
                  0: "bg-red-100 text-red-800",
                  1: "bg-green-100 text-green-800", 
                  2: "bg-blue-100 text-blue-800"
                }
                
                return (
                  <div key={item.formato} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={colorClasses[index as keyof typeof colorClasses]}>
                        {item.formato}
                      </Badge>
                      <span className="font-medium">{item.cantidad} reportes</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{percentage}%</p>
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-slate-600 h-1.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Nuevo Reporte</p>
                <p className="text-xs text-muted-foreground">Generar reporte personalizado</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <BarChart3 className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Dashboard Financiero</p>
                <p className="text-xs text-muted-foreground">Ver métricas en tiempo real</p>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <AlertCircle className="h-8 w-8" />
              <div className="text-center">
                <p className="font-medium">Reportes Programados</p>
                <p className="text-xs text-muted-foreground">Configurar automatización</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
