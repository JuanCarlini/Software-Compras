"use client"

import { useState, useEffect } from "react"
import { Reporte, ReporteEstadisticas, CreateReporteData } from "@/models"
import { ReporteController } from "@/controllers"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

export function useReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [estadisticas, setEstadisticas] = useState<ReporteEstadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReportes = async () => {
    try {
      setLoading(true)
      const [reportesData, estadisticasData] = await Promise.all([
        ReporteController.getAll(),
        ReporteController.getEstadisticas()
      ])
      setReportes(reportesData)
      setEstadisticas(estadisticasData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const createReporte = async (data: CreateReporteData) => {
    try {
      const nuevoReporte = await ReporteController.create(data)
      setReportes(prev => [nuevoReporte, ...prev])
      showSuccessToast(toastMessages.reporte.created, nuevoReporte.nombre)
      return nuevoReporte
    } catch (err) {
      showErrorToast(toastMessages.reporte.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const deleteReporte = async (id: string) => {
    try {
      await ReporteController.delete(id)
      setReportes(prev => prev.filter(reporte => reporte.id !== id))
      showSuccessToast(toastMessages.reporte.deleted)
    } catch (err) {
      showErrorToast(toastMessages.reporte.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const regenerarReporte = async (id: string) => {
    try {
      const reporteActualizado = await ReporteController.regenerar(id)
      if (reporteActualizado) {
        setReportes(prev => 
          prev.map(reporte => 
            reporte.id === id ? reporteActualizado : reporte
          )
        )
        showSuccessToast(toastMessages.reporte.regenerated, reporteActualizado.nombre)
      }
      return reporteActualizado
    } catch (err) {
      showErrorToast(toastMessages.reporte.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const descargarReporte = async (id: string, formato: 'pdf' | 'excel') => {
    try {
      const url = await ReporteController.descargar(id, formato)
      showSuccessToast(toastMessages.reporte.downloaded, `Formato: ${formato.toUpperCase()}`)
      return url
    } catch (err) {
      showErrorToast(toastMessages.reporte.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  useEffect(() => {
    fetchReportes()
  }, [])

  return {
    reportes,
    estadisticas,
    loading,
    error,
    refreshReportes: fetchReportes,
    createReporte,
    deleteReporte,
    regenerarReporte,
    descargarReporte
  }
}