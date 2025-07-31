"use client"

import { useReportes } from "@/shared/use-reportes"
import { ReportesDashboard } from "@/views/reportes-dashboard"
import { Card, CardContent } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ReportesDashboardPage() {
  const { estadisticas, loading, error } = useReportes()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reportes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard de Reportes</h1>
            <p className="text-slate-600">Estadísticas y métricas del sistema de reportes</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando estadísticas...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reportes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard de Reportes</h1>
            <p className="text-slate-600">Estadísticas y métricas del sistema de reportes</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!estadisticas) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reportes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard de Reportes</h1>
            <p className="text-slate-600">Estadísticas y métricas del sistema de reportes</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-slate-500">No hay estadísticas disponibles</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/reportes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard de Reportes</h1>
          <p className="text-slate-600">Estadísticas y métricas del sistema de reportes</p>
        </div>
      </div>
      
      <ReportesDashboard estadisticas={estadisticas} />
    </div>
  )
}
