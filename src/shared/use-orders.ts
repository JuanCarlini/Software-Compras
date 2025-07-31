"use client"

import { useState, useEffect } from "react"
import { OrdenCompra } from "@/models"
import { OrdenCompraService } from "@/controllers"

export function useOrders() {
  const [orders, setOrders] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await OrdenCompraService.getAll()
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
      const newOrder = await OrdenCompraService.create(orderData)
      setOrders(prev => [...prev, newOrder])
      return newOrder
    } catch (err) {
      throw err
    }
  }

  const updateOrder = async (id: string, orderData: any) => {
    try {
      const updatedOrder = await OrdenCompraService.update(id, orderData)
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
      await OrdenCompraService.delete(id)
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
    deleteOrder
  }
}
