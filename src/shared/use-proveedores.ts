"use client"

import { useState, useEffect } from "react"
import { Proveedor, EstadoProveedor } from "@/models"
import { ProveedorService } from "@/controllers"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const data = await ProveedorService.getAll()
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
      const newProveedor = await ProveedorService.create(proveedorData)
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
      const updatedProveedor = await ProveedorService.update(id, proveedorData)
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
      const updatedProveedor = await ProveedorService.update(id, { estado: EstadoProveedor.ACTIVO })
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
      const updatedProveedor = await ProveedorService.update(id, { estado: EstadoProveedor.INACTIVO })
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
      await ProveedorService.delete(id)
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
