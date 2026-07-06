"use client"

import { useState, useEffect } from "react"
import { OrdenPago } from "@/models"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

// Fila de OP enriquecida con el join de proveedor que hace OrdenPagoService.getAll
export type OrdenPagoRow = OrdenPago & { proveedor_nombre?: string }

// Acceso a datos SIEMPRE vía API routes (el browser no habla con Supabase — RLS niega anon)
async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

function put(id: string | number, payload: unknown) {
  return api(`/api/ordenes-pago/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function useOrdensPago() {
  const [orders, setOrders] = useState<OrdenPagoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await api("/api/ordenes-pago")
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
      const newOrder = await api("/api/ordenes-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })
      setOrders(prev => [...prev, newOrder])
      showSuccessToast(toastMessages.ordenPago.created, `Orden #${newOrder.numero_op}`)
      return newOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const updateOrder = async (id: string | number, orderData: any) => {
    try {
      const updatedOrder = await put(id, orderData)
      if (updatedOrder) {
        setOrders(prev =>
          prev.map(order => order.id === Number(id) ? { ...order, ...updatedOrder } : order)
        )

        // Toast message específico según el estado
        if (orderData.estado === 'aprobado') {
          showSuccessToast(toastMessages.ordenPago.approved, `Orden #${updatedOrder.numero_op}`)
        } else if (orderData.estado === 'pagado') {
          showSuccessToast(toastMessages.ordenPago.paid, `Orden #${updatedOrder.numero_op}`)
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
      const updatedOrder = await put(id, { estado: 'aprobado' })
      if (updatedOrder) {
        setOrders(prev =>
          prev.map(order => order.id === Number(id) ? { ...order, ...updatedOrder } : order)
        )
        showSuccessToast(toastMessages.ordenPago.approved, `Orden #${updatedOrder.numero_op}`)
      }
      return updatedOrder
    } catch (err) {
      showErrorToast(toastMessages.ordenPago.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  // Nota: gu_ordenesdepago no tiene columnas referencia_pago/fecha_pago — la referencia
  // bancaria del diálogo es informativa hasta que exista la columna (candidato a migración)
  const pagarOrder = async (id: string | number, _referencia?: string) => {
    try {
      const updatedOrder = await put(id, { estado: 'pagado' })
      if (updatedOrder) {
        setOrders(prev =>
          prev.map(order => order.id === Number(id) ? { ...order, ...updatedOrder } : order)
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
      const updatedOrder = await put(id, { estado: 'rechazado' })
      if (updatedOrder) {
        setOrders(prev =>
          prev.map(order => order.id === Number(id) ? { ...order, ...updatedOrder } : order)
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
      await api(`/api/ordenes-pago/${id}`, { method: "DELETE" })
      setOrders(prev => prev.filter(order => order.id !== Number(id)))
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
