"use client"

import { useState, useEffect } from "react"
import { Proveedor } from "@/models"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

// Acceso a datos SIEMPRE vía API routes (el browser no habla con Supabase — RLS niega anon).
// activar/suspender usan sus rutas dedicadas, que además chequean permisos por rol.
async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const data = await api("/api/proveedores")
      setProveedores(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const createProveedor = async (proveedorData: any) => {
    try {
      const newProveedor = await api("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedorData),
      })
      setProveedores(prev => [...prev, newProveedor])
      showSuccessToast(toastMessages.proveedor.created, newProveedor.nombre)
      return newProveedor
    } catch (err) {
      showErrorToast(toastMessages.proveedor.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const updateProveedor = async (id: number, proveedorData: any) => {
    try {
      const updatedProveedor = await api(`/api/proveedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedorData),
      })
      if (updatedProveedor) {
        setProveedores(prev =>
          prev.map(proveedor => proveedor.id === id ? updatedProveedor : proveedor)
        )
        showSuccessToast(toastMessages.proveedor.updated, updatedProveedor.nombre)
      }
      return updatedProveedor
    } catch (err) {
      showErrorToast(toastMessages.proveedor.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const activarProveedor = async (id: number) => {
    try {
      const updatedProveedor = await api(`/api/proveedores/${id}/activar`, { method: "PATCH" })
      if (updatedProveedor) {
        setProveedores(prev =>
          prev.map(proveedor => proveedor.id === id ? updatedProveedor : proveedor)
        )
        showSuccessToast(toastMessages.proveedor.activated, updatedProveedor.nombre)
      }
      return updatedProveedor
    } catch (err) {
      showErrorToast(toastMessages.proveedor.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const suspenderProveedor = async (id: number) => {
    try {
      // La DB solo tiene activo/inactivo: "suspender" se materializa como inactivo
      const updatedProveedor = await api(`/api/proveedores/${id}/suspender`, { method: "PATCH" })
      if (updatedProveedor) {
        setProveedores(prev =>
          prev.map(proveedor => proveedor.id === id ? updatedProveedor : proveedor)
        )
        showSuccessToast(toastMessages.proveedor.deactivated, updatedProveedor.nombre)
      }
      return updatedProveedor
    } catch (err) {
      showErrorToast(toastMessages.proveedor.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const deleteProveedor = async (id: number) => {
    try {
      await api(`/api/proveedores/${id}`, { method: "DELETE" })
      setProveedores(prev => prev.filter(proveedor => proveedor.id !== id))
      showSuccessToast(toastMessages.proveedor.deleted)
    } catch (err) {
      showErrorToast(toastMessages.proveedor.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  useEffect(() => {
    fetchProveedores()
  }, [])

  return {
    proveedores,
    loading,
    error,
    refreshProveedores: fetchProveedores,
    createProveedor,
    updateProveedor,
    activarProveedor,
    suspenderProveedor,
    deleteProveedor
  }
}
