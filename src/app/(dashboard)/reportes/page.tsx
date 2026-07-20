"use client"

import { useReportes } from "@/shared/use-reportes"
import { ReportesDashboard } from "@/views/reportes-dashboard"
import { Card, CardContent } from "@/views/ui/card"
import { Loader2 } from "lucide-react"

// /reportes = dashboard de indicadores reales (calculados desde OC + proveedores).
// El CRUD de "reportes guardados" era un mock en memoria y se eliminó (D1, 2026-07-06 d).
export default function ReportesPage() {
  const { estadisticas, loading, error } = useReportes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Indicadores y métricas del sistema</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando estadísticas...</span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      ) : !estadisticas ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No hay estadísticas disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <ReportesDashboard />
      )}
    </div>
  )
}
