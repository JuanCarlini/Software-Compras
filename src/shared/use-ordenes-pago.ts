"use client"

import { useState, useEffect } from "react"
import { OrdenPago } from "@/models"
import { OrdenPagoService } from "@/controllers"

export function useOrdensPago() {
  const [orders, setOrders] = useState<OrdenPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await OrdenPagoService.getAll()
      setOrders(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (orderData: any) => {
    try {
      const newOrder = await OrdenPagoService.create(orderData)
      setOrders(prev => [...prev, newOrder])
      return newOrder
    } catch (err) {
      throw err
    }
  }

  const updateOrder = async (id: string, orderData: any) => {
    try {
      const updatedOrder = await OrdenPagoService.update(id, orderData)
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
      }
      return updatedOrder
    } catch (err) {
      throw err
    }
  }

  const aprobarOrder = async (id: string) => {
    try {
      const updatedOrder = await OrdenPagoService.aprobar(id)
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
      }
      return updatedOrder
    } catch (err) {
      throw err
    }
  }

  const pagarOrder = async (id: string, referencia: string) => {
    try {
      const updatedOrder = await OrdenPagoService.pagar(id, referencia)
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
      }
      return updatedOrder
    } catch (err) {
      throw err
    }
  }

  const rechazarOrder = async (id: string) => {
    try {
      const updatedOrder = await OrdenPagoService.rechazar(id)
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
      }
      return updatedOrder
    } catch (err) {
      throw err
    }
  }

  const deleteOrder = async (id: string) => {
    try {
      await OrdenPagoService.delete(id)
      setOrders(prev => prev.filter(order => order.id !== id))
    } catch (err) {
      throw err
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return {
    orders,
    loading,
    error,
    refreshOrders: fetchOrders,
    createOrder,
    updateOrder,
    aprobarOrder,
    pagarOrder,
    rechazarOrder,
    deleteOrder
  }
}
