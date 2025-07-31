"use client"

import { useState, useEffect } from "react"
import { Reporte, CreateReporteData } from "@/models"
import { ReporteController, EstadisticasReportes } from "@/controllers"

export function useReportes() {
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasReportes | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReportes = async () => {
    try {
      setLoading(true)
      const data = await ReporteController.getAll()
      setReportes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const fetchEstadisticas = async () => {
    try {
      const data = await ReporteController.getEstadisticas()
      setEstadisticas(data)
    } catch (err) {
      console.error("Error al cargar estadísticas:", err)
    }
  }

  const createReporte = async (reporteData: CreateReporteData) => {
    try {
      const newReporte = await ReporteController.create(reporteData)
      setReportes(prev => [newReporte, ...prev])
      return newReporte
    } catch (err) {
      throw err
    }
  }

  const deleteReporte = async (id: string) => {
    try {
      await ReporteController.delete(id)
      setReportes(prev => prev.filter(reporte => reporte.id !== id))
    } catch (err) {
      throw err
    }
  }

  const regenerarReporte = async (id: string) => {
    try {
      const updatedReporte = await ReporteController.regenerar(id)
      if (updatedReporte) {
        setReportes(prev => 
          prev.map(reporte => reporte.id === id ? updatedReporte : reporte)
        )
      }
      return updatedReporte
    } catch (err) {
      throw err
    }
  }

  const getReporteData = async (tipo: any, parametros: any) => {
    try {
      return await ReporteController.getReporteData(tipo, parametros)
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchReportes()
    fetchEstadisticas()
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
    getReporteData
  }
}

export function useReporte(id: string) {
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReporte = async () => {
      try {
        setLoading(true)
        const data = await ReporteController.getById(id)
        setReporte(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchReporte()
    }
  }, [id])

  return {
    reporte,
    loading,
    error
  }
}
