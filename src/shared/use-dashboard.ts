"use client"

import { useState, useEffect } from "react"
import { OrdenCompraService } from "@/controllers/orden-compra.controller"
import { OrdenPagoController } from "@/controllers/orden-pago.controller"
import { ProveedorController } from "@/controllers/proveedor.controller"
import { OrdenCompra, OrdenPago, Proveedor, EstadoOrdenCompra, EstadoOrdenPago, EstadoProveedor } from "@/models"

export interface DashboardStats {
  ordenesCompra: {
    total: number
    pendientes: number
    aprobadas: number
    recientes: number
  }
  ordenesPago: {
    total: number
    pendientes: number
    aprobadas: number
    vencidas: number
    montoTotal: number
  }
  proveedores: {
    total: number
    activos: number
    nuevos: number
  }
  actividadReciente: Array<{
    id: string
    tipo: 'orden_compra' | 'orden_pago' | 'proveedor'
    descripcion: string
    fecha: Date
    estado?: string
  }>
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Obtener datos en paralelo
      const [ordenesCompra, ordenesPago, proveedores] = await Promise.all([
        OrdenCompraService.getAll(),
        OrdenPagoController.getAll(),
        ProveedorController.getAll()
      ])

      // Calcular estadísticas de órdenes de compra
      const ordenesCompraStats = {
        total: ordenesCompra.length,
        pendientes: ordenesCompra.filter(o => o.estado === EstadoOrdenCompra.PENDIENTE).length,
        aprobadas: ordenesCompra.filter(o => o.estado === EstadoOrdenCompra.APROBADA).length,
        recientes: ordenesCompra.filter(o => {
          const unaSemanaAtras = new Date()
          unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7)
          return new Date(o.created_at) >= unaSemanaAtras
        }).length
      }

      // Calcular estadísticas de órdenes de pago
      const ordenesPagoStats = {
        total: ordenesPago.length,
        pendientes: ordenesPago.filter(o => o.estado === EstadoOrdenPago.PENDIENTE).length,
        aprobadas: ordenesPago.filter(o => o.estado === EstadoOrdenPago.APROBADA).length,
        vencidas: ordenesPago.filter(o => {
          const hoy = new Date()
          return new Date(o.fecha_vencimiento) < hoy && 
                 [EstadoOrdenPago.PENDIENTE, EstadoOrdenPago.APROBADA].includes(o.estado)
        }).length,
        montoTotal: ordenesPago
          .filter(o => o.estado === EstadoOrdenPago.PAGADA)
          .reduce((sum, o) => sum + o.monto, 0)
      }

      // Calcular estadísticas de proveedores
      const proveedoresStats = {
        total: proveedores.length,
        activos: proveedores.filter(p => p.estado === EstadoProveedor.ACTIVO).length,
        nuevos: proveedores.filter(p => {
          const unMesAtras = new Date()
          unMesAtras.setMonth(unMesAtras.getMonth() - 1)
          return new Date(p.created_at) >= unMesAtras
        }).length
      }

      // Generar actividad reciente (últimas 10 actividades)
      const actividadReciente: DashboardStats['actividadReciente'] = []
      
      // Agregar órdenes de compra recientes
      ordenesCompra
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .forEach(orden => {
          actividadReciente.push({
            id: orden.id,
            tipo: 'orden_compra',
            descripcion: `Nueva orden de compra ${orden.numero}`,
            fecha: new Date(orden.created_at),
            estado: orden.estado
          })
        })

      // Agregar órdenes de pago recientes
      ordenesPago
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .forEach(orden => {
          actividadReciente.push({
            id: orden.id,
            tipo: 'orden_pago',
            descripcion: `Orden de pago ${orden.numero} - ${orden.proveedor_nombre}`,
            fecha: new Date(orden.created_at),
            estado: orden.estado
          })
        })

      // Agregar proveedores recientes
      proveedores
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)
        .forEach(proveedor => {
          actividadReciente.push({
            id: proveedor.id,
            tipo: 'proveedor',
            descripcion: `Nuevo proveedor: ${proveedor.nombre}`,
            fecha: new Date(proveedor.created_at),
            estado: proveedor.estado
          })
        })

      // Ordenar actividad por fecha (más reciente primero) y tomar las últimas 10
      actividadReciente.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      actividadReciente.splice(10) // Mantener solo las últimas 10

      setStats({
        ordenesCompra: ordenesCompraStats,
        ordenesPago: ordenesPagoStats,
        proveedores: proveedoresStats,
        actividadReciente
      })
      
      setError(null)
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    stats,
    loading,
    error,
    refreshData: fetchDashboardData
  }
}
