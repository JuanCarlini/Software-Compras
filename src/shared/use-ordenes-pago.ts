"use client"

import { useState, useEffect } from "react"
import { OrdenPago } from "@/models"
import { OrdenPagoService } from "@/controllers"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

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
      showSuccessToast(toastMessages.ordenPago.created, `Orden #${newOrder.numero}`)
      return newOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const updateOrder = async (id: string | number, orderData: any) => {
    try {
      const updatedOrder = await OrdenPagoService.update(Number(id), orderData)
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
        
        // Toast message específico según el estado
        if (orderData.estado) {
          if (orderData.estado === 'aprobado') {
            showSuccessToast(toastMessages.ordenPago.approved, `Orden #${updatedOrder.numero_op}`)
          } else if (orderData.estado === 'pagado') {
            showSuccessToast(toastMessages.ordenPago.paid, `Orden #${updatedOrder.numero_op}`)
          } else {
            showSuccessToast(toastMessages.ordenPago.updated, `Orden #${updatedOrder.numero_op}`)
          }
        } else {
          showSuccessToast(toastMessages.ordenPago.updated, `Orden #${updatedOrder.numero_op}`)
        }
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const aprobarOrder = async (id: string | number) => {
    try {
      const updatedOrder = await OrdenPagoService.update(Number(id), { estado: 'aprobado' })
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
        showSuccessToast(toastMessages.ordenPago.approved, `Orden #${updatedOrder.numero_op}`)
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const pagarOrder = async (id: string | number, referencia: string) => {
    try {
      const updatedOrder = await OrdenPagoService.update(Number(id), { 
        estado: 'pagado',
        referencia_pago: referencia,
        fecha_pago: new Date().toISOString()
      })
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
        showSuccessToast(toastMessages.ordenPago.paid, `Orden #${updatedOrder.numero_op}`)
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const rechazarOrder = async (id: string | number) => {
    try {
      const updatedOrder = await OrdenPagoService.update(Number(id), { estado: 'rechazado' })
      if (updatedOrder) {
        setOrders(prev => 
          prev.map(order => order.id === id ? updatedOrder : order)
        )
        showSuccessToast(toastMessages.ordenPago.rejected, `Orden #${updatedOrder.numero_op}`)
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const deleteOrder = async (id: string | number) => {
    try {
      await OrdenPagoService.delete(Number(id))
      setOrders(prev => prev.filter(order => order.id !== id))
      showSuccessToast(toastMessages.ordenPago.deleted)
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
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
