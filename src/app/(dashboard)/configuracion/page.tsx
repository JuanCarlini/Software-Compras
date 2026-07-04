"use client"

import { useConfiguracion } from "@/shared/use-configuracion"
import { ConfiguracionEmpresa } from "@/views/configuracion-empresa"
import { ConfiguracionSistema } from "@/views/configuracion-sistema"
import { Card, CardContent } from "@/views/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/views/ui/tabs"
import { Loader2 } from "lucide-react"

export default function ConfiguracionPage() {
  const {
    empresa,
    configuracionSistema,
    loading,
    error,
    updateEmpresa,
    updateConfiguracionSistema,
    uploadLogo,
    testNotificacion,
    exportarConfiguracion,
    importarConfiguracion,
    resetearConfiguracion
  } = useConfiguracion()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-600">Gestiona la configuración de la empresa y del sistema</p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando configuración...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-600">Gestiona la configuración de la empresa y del sistema</p>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!empresa || !configuracionSistema) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-600">Gestiona la configuración de la empresa y del sistema</p>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-slate-500">No se pudo cargar la configuración</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-600">Gestiona la configuración de la empresa y del sistema</p>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="empresa">Información de la Empresa</TabsTrigger>
          <TabsTrigger value="sistema">Configuración del Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <ConfiguracionEmpresa 
            empresa={empresa}
            onUpdate={updateEmpresa}
            onUploadLogo={uploadLogo}
          />
        </TabsContent>

        <TabsContent value="sistema">
          <ConfiguracionSistema 
            configuracion={configuracionSistema}
            onUpdate={updateConfiguracionSistema}
            onTestNotificacion={testNotificacion}
            onExportar={exportarConfiguracion}
            onImportar={importarConfiguracion}
            onResetear={resetearConfiguracion}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
