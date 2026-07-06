"use client"

import { useState, useEffect } from "react"
import { OrdenCompra } from "@/models"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

// Acceso a datos SIEMPRE vía API routes (el browser no habla con Supabase — RLS niega anon)
async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

export function useOrders() {
  const [orders, setOrders] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await api("/api/ordenes-compra")
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
      const newOrder = await api("/api/ordenes-compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
      setOrders(prev => [...prev, newOrder])
      showSuccessToast(toastMessages.ordenCompra.created, `Orden #${newOrder.numero_oc}`)
      return newOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenCompra.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const updateOrder = async (id: string | number, orderData: any) => {
    try {
      const updatedOrder = await api(`/api/ordenes-compra/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
      if (updatedOrder) {
        setOrders(prev =>
          prev.map(order => order.id === Number(id) ? updatedOrder : order)
        )

        // Toast message específico según el estado
        if (orderData.estado) {
          if (orderData.estado === 'aprobado') {
            showSuccessToast(toastMessages.ordenCompra.approved, `Orden #${updatedOrder.numero_oc}`)
          } else if (orderData.estado === 'anulado' || orderData.estado === 'rechazado') {
            showSuccessToast(toastMessages.ordenCompra.rejected, `Orden #${updatedOrder.numero_oc}`)
          } else {
            showSuccessToast(toastMessages.ordenCompra.updated, `Orden #${updatedOrder.numero_oc}`)
          }
        } else {
          showSuccessToast(toastMessages.ordenCompra.updated, `Orden #${updatedOrder.numero_oc}`)
        }
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenCompra.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const deleteOrder = async (id: string | number) => {
    try {
      await api(`/api/ordenes-compra/${id}`, { method: "DELETE" })
      setOrders(prev => prev.filter(order => order.id !== Number(id)))
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
