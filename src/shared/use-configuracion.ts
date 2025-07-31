"use client"

import { useState, useEffect } from "react"
import { Empresa, UpdateEmpresaData } from "@/models"
import { ConfiguracionController, ConfiguracionSistema } from "@/controllers"

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
      return updatedEmpresa
    } catch (err) {
      throw err
    }
  }

  const updateConfiguracionSistema = async (data: Partial<ConfiguracionSistema>) => {
    try {
      const updatedConfig = await ConfiguracionController.updateConfiguracionSistema(data)
      setConfiguracionSistema(updatedConfig)
      return updatedConfig
    } catch (err) {
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
      return logoUrl
    } catch (err) {
      throw err
    }
  }

  const testNotificacion = async () => {
    try {
      return await ConfiguracionController.testNotificacion()
    } catch (err) {
      throw err
    }
  }

  const exportarConfiguracion = async () => {
    try {
      return await ConfiguracionController.exportarConfiguracion()
    } catch (err) {
      throw err
    }
  }

  const importarConfiguracion = async (configJson: string) => {
    try {
      const success = await ConfiguracionController.importarConfiguracion(configJson)
      if (success) {
        await fetchConfiguracion() // Recargar datos
      }
      return success
    } catch (err) {
      throw err
    }
  }

  const resetearConfiguracion = async () => {
    try {
      const success = await ConfiguracionController.resetearConfiguracion()
      if (success) {
        await fetchConfiguracion() // Recargar datos
      }
      return success
    } catch (err) {
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
