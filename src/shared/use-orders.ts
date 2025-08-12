"use client"

import { useState, useEffect } from "react"
import { OrdenCompra } from "@/models"
import { OrdenCompraService } from "@/controllers"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

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
      showSuccessToast(toastMessages.ordenCompra.created, `Orden #${newOrder.numero}`)
      return newOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenCompra.error, err instanceof Error ? err.message : "Error desconocido")
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
        
        // Toast message específico según el estado
        if (orderData.estado) {
          if (orderData.estado === 'Aprobada') {
            showSuccessToast(toastMessages.ordenCompra.approved, `Orden #${updatedOrder.numero}`)
          } else if (orderData.estado === 'Rechazada') {
            showSuccessToast(toastMessages.ordenCompra.rejected, `Orden #${updatedOrder.numero}`)
          } else {
            showSuccessToast(toastMessages.ordenCompra.updated, `Orden #${updatedOrder.numero}`)
          }
        } else {
          showSuccessToast(toastMessages.ordenCompra.updated, `Orden #${updatedOrder.numero}`)
        }
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenCompra.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const deleteOrder = async (id: string) => {
    try {
      await OrdenCompraService.delete(id)
      setOrders(prev => prev.filter(order => order.id !== id))
      showSuccessToast(toastMessages.ordenCompra.deleted)
    } catch (err) {
      showErrorToast(toastMessages.ordenCompra.error, err instanceof Error ? err.message : "Error desconocido")
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
