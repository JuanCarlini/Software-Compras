"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { 
  Building2, 
  Upload, 
  Save, 
  Loader2,
  Image as ImageIcon
} from "lucide-react"
import { Empresa, UpdateEmpresaData } from "@/models"

const empresaSchema = z.object({
  razon_social: z.string().min(1, "La razón social es requerida"),
  nombre_comercial: z.string().min(1, "El nombre comercial es requerido"),
  rut: z.string().min(1, "El RUT es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  ciudad: z.string().min(1, "La ciudad es requerida"),
  pais: z.string().min(1, "El país es requerido"),
  telefono: z.string().min(1, "El teléfono es requerido"),
  email: z.string().email("Email inválido"),
  sitio_web: z.string().url("URL inválida").optional().or(z.literal("")),
  configuracion: z.object({
    moneda_default: z.string().min(1, "La moneda es requerida"),
    idioma: z.string().min(1, "El idioma es requerido"),
    zona_horaria: z.string().min(1, "La zona horaria es requerida"),
    formato_fecha: z.string().min(1, "El formato de fecha es requerido"),
    iva_default: z.number().min(0).max(100, "El IVA debe estar entre 0 y 100"),
    prefijo_orden_compra: z.string().min(1, "El prefijo de orden de compra es requerido"),
    prefijo_orden_pago: z.string().min(1, "El prefijo de orden de pago es requerido"),
    dias_vencimiento_default: z.number().min(1, "Los días de vencimiento deben ser mayores a 0")
  })
})

type FormData = z.infer<typeof empresaSchema>

interface Props {
  empresa: Empresa
  onUpdate: (data: UpdateEmpresaData) => Promise<void>
  onUploadLogo: (file: File) => Promise<string>
}

export function ConfiguracionEmpresa({ empresa, onUpdate, onUploadLogo }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      razon_social: empresa.razon_social,
      nombre_comercial: empresa.nombre_comercial,
      rut: empresa.rut,
      direccion: empresa.direccion,
      ciudad: empresa.ciudad,
      pais: empresa.pais,
      telefono: empresa.telefono,
      email: empresa.email,
      sitio_web: empresa.sitio_web || "",
      configuracion: empresa.configuracion
    }
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const updateData: UpdateEmpresaData = {
        ...data,
        sitio_web: data.sitio_web?.trim() || undefined
      }

      await onUpdate(updateData)
      setSuccess("Configuración actualizada exitosamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona una imagen válida")
      return
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen debe ser menor a 2MB")
      return
    }

    try {
      setIsUploadingLogo(true)
      setError(null)
      await onUploadLogo(file)
      setSuccess("Logo actualizado exitosamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el logo")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Información de la Empresa</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo de la Empresa */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Logo de la Empresa</h3>
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {empresa.logo_url ? (
                  <img 
                    src={empresa.logo_url} 
                    alt="Logo empresa" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button type="button" variant="outline" asChild disabled={isUploadingLogo}>
                    <span className="cursor-pointer">
                      {isUploadingLogo ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploadingLogo ? "Subiendo..." : "Cambiar Logo"}
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG hasta 2MB</p>
              </div>
            </div>
          </div>

          {/* Información Básica */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input
                  id="razon_social"
                  {...form.register("razon_social")}
                />
                {form.formState.errors.razon_social && (
                  <p className="text-sm text-red-600">{form.formState.errors.razon_social.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre_comercial">Nombre Comercial *</Label>
                <Input
                  id="nombre_comercial"
                  {...form.register("nombre_comercial")}
                />
                {form.formState.errors.nombre_comercial && (
                  <p className="text-sm text-red-600">{form.formState.errors.nombre_comercial.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  {...form.register("rut")}
                />
                {form.formState.errors.rut && (
                  <p className="text-sm text-red-600">{form.formState.errors.rut.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  {...form.register("telefono")}
                />
                {form.formState.errors.telefono && (
                  <p className="text-sm text-red-600">{form.formState.errors.telefono.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sitio_web">Sitio Web</Label>
                <Input
                  id="sitio_web"
                  type="url"
                  {...form.register("sitio_web")}
                />
                {form.formState.errors.sitio_web && (
                  <p className="text-sm text-red-600">{form.formState.errors.sitio_web.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  {...form.register("direccion")}
                />
                {form.formState.errors.direccion && (
                  <p className="text-sm text-red-600">{form.formState.errors.direccion.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  {...form.register("ciudad")}
                />
                {form.formState.errors.ciudad && (
                  <p className="text-sm text-red-600">{form.formState.errors.ciudad.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pais">País *</Label>
                <Select 
                  value={form.watch("pais")} 
                  onValueChange={(value) => form.setValue("pais", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Uruguay">Uruguay</SelectItem>
                    <SelectItem value="Paraguay">Paraguay</SelectItem>
                    <SelectItem value="Bolivia">Bolivia</SelectItem>
                    <SelectItem value="Perú">Perú</SelectItem>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.pais && (
                  <p className="text-sm text-red-600">{form.formState.errors.pais.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Configuración Regional */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Configuración Regional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="moneda_default">Moneda por Defecto *</Label>
                <Select 
                  value={form.watch("configuracion.moneda_default")} 
                  onValueChange={(value) => form.setValue("configuracion.moneda_default", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="BRL">Real Brasileño (BRL)</SelectItem>
                    <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idioma">Idioma *</Label>
                <Select 
                  value={form.watch("configuracion.idioma")} 
                  onValueChange={(value) => form.setValue("configuracion.idioma", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es-AR">Español (Argentina)</SelectItem>
                    <SelectItem value="es-ES">Español (España)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zona_horaria">Zona Horaria *</Label>
                <Select 
                  value={form.watch("configuracion.zona_horaria")} 
                  onValueChange={(value) => form.setValue("configuracion.zona_horaria", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Argentina/Buenos_Aires">Buenos Aires (UTC-3)</SelectItem>
                    <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                    <SelectItem value="America/Santiago">Santiago (UTC-3)</SelectItem>
                    <SelectItem value="America/Montevideo">Montevideo (UTC-3)</SelectItem>
                    <SelectItem value="America/New_York">Nueva York (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formato_fecha">Formato de Fecha *</Label>
                <Select 
                  value={form.watch("configuracion.formato_fecha")} 
                  onValueChange={(value) => form.setValue("configuracion.formato_fecha", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configuración Comercial */}
          <div>
            <h3 className="text-lg font-medium text-slate-900 mb-4">Configuración Comercial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="iva_default">IVA por Defecto (%) *</Label>
                <Input
                  id="iva_default"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...form.register("configuracion.iva_default", { valueAsNumber: true })}
                />
                {form.formState.errors.configuracion?.iva_default && (
                  <p className="text-sm text-red-600">{form.formState.errors.configuracion.iva_default.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dias_vencimiento_default">Días de Vencimiento por Defecto *</Label>
                <Input
                  id="dias_vencimiento_default"
                  type="number"
                  min="1"
                  {...form.register("configuracion.dias_vencimiento_default", { valueAsNumber: true })}
                />
                {form.formState.errors.configuracion?.dias_vencimiento_default && (
                  <p className="text-sm text-red-600">{form.formState.errors.configuracion.dias_vencimiento_default.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefijo_orden_compra">Prefijo Orden de Compra *</Label>
                <Input
                  id="prefijo_orden_compra"
                  {...form.register("configuracion.prefijo_orden_compra")}
                />
                {form.formState.errors.configuracion?.prefijo_orden_compra && (
                  <p className="text-sm text-red-600">{form.formState.errors.configuracion.prefijo_orden_compra.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefijo_orden_pago">Prefijo Orden de Pago *</Label>
                <Input
                  id="prefijo_orden_pago"
                  {...form.register("configuracion.prefijo_orden_pago")}
                />
                {form.formState.errors.configuracion?.prefijo_orden_pago && (
                  <p className="text-sm text-red-600">{form.formState.errors.configuracion.prefijo_orden_pago.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 pt-6 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
