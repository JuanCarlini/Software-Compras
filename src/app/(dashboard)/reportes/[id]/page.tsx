"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ReporteDetails } from "@/views/reporte-details"
import { Card, CardContent } from "@/views/ui/card"
import { Loader2 } from "lucide-react"
import { useReporte } from "@/shared/use-reportes"
import { ReporteController } from "@/controllers"

export default function ReporteDetailsPage() {
  const params = useParams()
  const reporteId = params.id as string
  const { reporte, loading, error } = useReporte(reporteId)
  const [reporteData, setReporteData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    const fetchReporteData = async () => {
      if (!reporte) return
      
      try {
        setDataLoading(true)
        const data = await ReporteController.getReporteData(reporte.tipo, reporte.parametros)
        setReporteData(data)
      } catch (err) {
        console.error("Error al cargar datos del reporte:", err)
      } finally {
        setDataLoading(false)
      }
    }

    if (reporte) {
      fetchReporteData()
    }
  }, [reporte])

  const handleRegenerar = async () => {
    if (!reporte) return
    try {
      await ReporteController.regenerar(reporte.id)
      // Recargar la página o actualizar el estado
      window.location.reload()
    } catch (error) {
      console.error("Error al regenerar reporte:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando reporte...</span>
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

  if (!reporte) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-slate-500">Reporte no encontrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <ReporteDetails 
      reporte={reporte}
      onRegenerar={handleRegenerar}
      reporteData={dataLoading ? null : reporteData}
    />
  )
}
