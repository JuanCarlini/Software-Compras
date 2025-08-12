"use client"

import { useState, useEffect } from "react"
import { Proveedor } from "@/models"
import { ProveedorController } from "@/controllers"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

export function useProveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const data = await ProveedorController.getAll()
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
      const newProveedor = await ProveedorController.create(proveedorData)
      setProveedores(prev => [...prev, newProveedor])
      showSuccessToast(toastMessages.proveedor.created, newProveedor.nombre)
      return newProveedor
    } catch (err) {
      showErrorToast(toastMessages.proveedor.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const updateProveedor = async (id: string, proveedorData: any) => {
    try {
      const updatedProveedor = await ProveedorController.update(id, proveedorData)
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

  const activarProveedor = async (id: string) => {
    try {
      const updatedProveedor = await ProveedorController.activar(id)
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

  const suspenderProveedor = async (id: string) => {
    try {
      const updatedProveedor = await ProveedorController.suspender(id)
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

  const deleteProveedor = async (id: string) => {
    try {
      await ProveedorController.delete(id)
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
