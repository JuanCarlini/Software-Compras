"use client"

import { Button } from "@/views/ui/button"
import { Plus, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useReportes } from "@/shared/use-reportes"
import { ReportesDashboard } from "@/views/reportes-dashboard"
import { ReportesList } from "@/views/reportes-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/views/ui/tabs"

export default function ReportesPage() {
  const { 
    reportes, 
    estadisticas, 
    loading, 
    error, 
    deleteReporte, 
    regenerarReporte 
  } = useReportes()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
          <p className="text-slate-600">Genera y consulta reportes del sistema</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/reportes/dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/reportes/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Generar Reporte
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="reportes">Todos los Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {estadisticas ? (
            <ReportesDashboard estadisticas={estadisticas} />
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Cargando estadísticas...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reportes">
          <ReportesList 
            reportes={reportes}
            loading={loading}
            error={error}
            onDelete={deleteReporte}
            onRegenerar={regenerarReporte}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
