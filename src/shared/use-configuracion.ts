"use client"

import { useState, useEffect } from "react"
import { Empresa, UpdateEmpresaData } from "@/models"
import { ConfiguracionController, ConfiguracionSistema } from "@/controllers"
import { showSuccessToast, showErrorToast, toastMessages } from "./toast-helpers"

export function useConfiguracion() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [configuracionSistema, setConfiguracionSistema] = useState<ConfiguracionSistema | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfiguracion = async () => {
    try {
      setLoading(true)
      const [empresaData, sistemaData] = await Promise.all([
        ConfiguracionController.getEmpresa(),
        ConfiguracionController.getConfiguracionSistema()
      ])
      setEmpresa(empresaData)
      setConfiguracionSistema(sistemaData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const updateEmpresa = async (data: UpdateEmpresaData) => {
    try {
      const updatedEmpresa = await ConfiguracionController.updateEmpresa(data)
      setEmpresa(updatedEmpresa)
      showSuccessToast(toastMessages.configuracion.updated, "Información de empresa")
      return updatedEmpresa
    } catch (err) {
      showErrorToast(toastMessages.configuracion.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const updateConfiguracionSistema = async (data: Partial<ConfiguracionSistema>) => {
    try {
      const updatedConfig = await ConfiguracionController.updateConfiguracionSistema(data)
      setConfiguracionSistema(updatedConfig)
      showSuccessToast(toastMessages.configuracion.updated, "Configuración del sistema")
      return updatedConfig
    } catch (err) {
      showErrorToast(toastMessages.configuracion.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const uploadLogo = async (file: File) => {
    try {
      const logoUrl = await ConfiguracionController.uploadLogo(file)
      if (empresa) {
        const updatedEmpresa = { ...empresa, logo_url: logoUrl, updated_at: new Date() }
        setEmpresa(updatedEmpresa)
      }
      showSuccessToast(toastMessages.configuracion.logoUploaded)
      return logoUrl
    } catch (err) {
      showErrorToast(toastMessages.configuracion.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const testNotificacion = async () => {
    try {
      const result = await ConfiguracionController.testNotificacion()
      showSuccessToast("Test de notificación exitoso", "Las notificaciones están funcionando correctamente")
      return result
    } catch (err) {
      showErrorToast("Error en test de notificación", err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const exportarConfiguracion = async () => {
    try {
      const result = await ConfiguracionController.exportarConfiguracion()
      showSuccessToast(toastMessages.configuracion.exported)
      return result
    } catch (err) {
      showErrorToast(toastMessages.configuracion.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  const importarConfiguracion = async (configJson: string) => {
    try {
      const success = await ConfiguracionController.importarConfiguracion(configJson)
      if (success) {
        await fetchConfiguracion() // Recargar datos
        showSuccessToast(toastMessages.configuracion.imported)
      }
      return success
    } catch (err) {
      showErrorToast(toastMessages.configuracion.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }
  /*  } catch (err) {
      throw err
    }
  }*/

  const resetearConfiguracion = async () => {
    try {
      const success = await ConfiguracionController.resetearConfiguracion()
      if (success) {
        await fetchConfiguracion() // Recargar datos
        showSuccessToast(toastMessages.configuracion.reset)
      }
      return success
    } catch (err) {
      showErrorToast(toastMessages.configuracion.error, err instanceof Error ? err.message : "Error desconocido")
      throw err
    }
  }

  useEffect(() => {
    fetchConfiguracion()
  }, [])

  return {
    empresa,
    configuracionSistema,
    loading,
    error,
    refreshConfiguracion: fetchConfiguracion,
    updateEmpresa,
    updateConfiguracionSistema,
    uploadLogo,
    testNotificacion,
    exportarConfiguracion,
    importarConfiguracion,
    resetearConfiguracion
  }
}
