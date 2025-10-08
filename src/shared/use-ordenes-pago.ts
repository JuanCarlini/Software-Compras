"use client"

import { useState, useEffect } from "react"
import { OrdenPago } from "@/models"
import { OrdenPagoController } from "@/controllers"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

export function useOrdensPago() {
  const [orders, setOrders] = useState<OrdenPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await OrdenPagoController.getAll()
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
      const newOrder = await OrdenPagoController.create(orderData)
      setOrders(prev => [...prev, newOrder])
      showSuccessToast(toastMessages.ordenPago.created, `Orden #${newOrder.numero}`)
      return newOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const updateOrder = async (id: string, orderData: any) => {
    try {
      const updatedOrder = await OrdenPagoController.update(id, orderData)
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
        
        // Toast message específico según el estado
        if (orderData.estado) {
          if (orderData.estado === 'Aprobada') {
            showSuccessToast(toastMessages.ordenPago.approved, `Orden #${updatedOrder.numero}`)
          } else if (orderData.estado === 'Pagada') {
            showSuccessToast(toastMessages.ordenPago.paid, `Orden #${updatedOrder.numero}`)
          } else {
            showSuccessToast(toastMessages.ordenPago.updated, `Orden #${updatedOrder.numero}`)
          }
        } else {
          showSuccessToast(toastMessages.ordenPago.updated, `Orden #${updatedOrder.numero}`)
        }
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const aprobarOrder = async (id: string) => {
    try {
      const updatedOrder = await OrdenPagoController.aprobar(id)
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
      const updatedOrder = await OrdenPagoController.marcarPagada(id, referencia)
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
      const updatedOrder = await OrdenPagoController.rechazar(id)
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
      await OrdenPagoController.delete(id)
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
