"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Label } from "@/views/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Switch } from "@/views/ui/switch"
import { Input } from "@/views/ui/input"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Save,
  TestTube,
  Download,
  Upload,
  RotateCcw,
  Loader2
} from "lucide-react"
import { ConfiguracionSistema } from "@/controllers"

interface Props {
  configuracion: ConfiguracionSistema
  onUpdate: (data: Partial<ConfiguracionSistema>) => Promise<void>
  onTestNotificacion: () => Promise<boolean>
  onExportar: () => Promise<string>
  onImportar: (config: string) => Promise<boolean>
  onResetear: () => Promise<boolean>
}

export function ConfiguracionSistema({ 
  configuracion, 
  onUpdate, 
  onTestNotificacion,
  onExportar,
  onImportar,
  onResetear 
}: Props) {
  const [localConfig, setLocalConfig] = useState<ConfiguracionSistema>(configuracion)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateConfigValue = (key: keyof ConfiguracionSistema, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      
      await onUpdate(localConfig)
      setSuccess("Configuración actualizada exitosamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar la configuración")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotificacion = async () => {
    try {
      setIsTesting(true)
      setError(null)
      setSuccess(null)
      
      const result = await onTestNotificacion()
      if (result) {
        setSuccess("Notificación de prueba enviada exitosamente")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar notificación de prueba")
    } finally {
      setIsTesting(false)
    }
  }

  const handleExportar = async () => {
    try {
      setIsExporting(true)
      setError(null)
      
      const configJson = await onExportar()
      
      // Crear y descargar archivo
      const blob = new Blob([configJson], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `configuracion-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setSuccess("Configuración exportada exitosamente")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al exportar configuración")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setError(null)
      setSuccess(null)
      
      const text = await file.text()
      const result = await onImportar(text)
      
      if (result) {
        setSuccess("Configuración importada exitosamente")
        // Actualizar configuración local
        const parsed = JSON.parse(text)
        if (parsed.sistema) {
          setLocalConfig(parsed.sistema)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar configuración")
    } finally {
      setIsImporting(false)
      // Limpiar input
      event.target.value = ''
    }
  }

  const handleResetear = async () => {
    if (!confirm("¿Estás seguro de que quieres resetear toda la configuración? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      setIsResetting(true)
      setError(null)
      setSuccess(null)
      
      const result = await onResetear()
      if (result) {
        setSuccess("Configuración reseteada a valores por defecto")
        // La configuración se actualizará automáticamente por el hook
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resetear configuración")
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notificaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notificaciones_email">Notificaciones por Email</Label>
              <p className="text-sm text-slate-600">Recibir notificaciones importantes por correo electrónico</p>
            </div>
            <Switch
              id="notificaciones_email"
              checked={localConfig.notificaciones_email}
              onCheckedChange={(checked) => updateConfigValue('notificaciones_email', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notificaciones_push">Notificaciones Push</Label>
              <p className="text-sm text-slate-600">Recibir notificaciones en tiempo real en el navegador</p>
            </div>
            <Switch
              id="notificaciones_push"
              checked={localConfig.notificaciones_push}
              onCheckedChange={(checked) => updateConfigValue('notificaciones_push', checked)}
            />
          </div>

          <div className="pt-2">
            <Button 
              variant="outline" 
              onClick={handleTestNotificacion}
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Enviar Notificación de Prueba
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seguridad y Respaldos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Seguridad y Respaldos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="backup_automatico">Backup Automático</Label>
              <p className="text-sm text-slate-600">Realizar copias de seguridad automáticas del sistema</p>
            </div>
            <Switch
              id="backup_automatico"
              checked={localConfig.backup_automatico}
              onCheckedChange={(checked) => updateConfigValue('backup_automatico', checked)}
            />
          </div>

          {localConfig.backup_automatico && (
            <div className="space-y-2">
              <Label htmlFor="frecuencia_backup">Frecuencia de Backup</Label>
              <Select 
                value={localConfig.frecuencia_backup} 
                onValueChange={(value) => updateConfigValue('frecuencia_backup', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diario</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="retencion_logs">Retención de Logs (días)</Label>
            <Input
              id="retencion_logs"
              type="number"
              min="1"
              max="365"
              value={localConfig.retencion_logs}
              onChange={(e) => updateConfigValue('retencion_logs', parseInt(e.target.value) || 90)}
            />
            <p className="text-sm text-slate-600">Días que se mantendrán los registros del sistema</p>
          </div>
        </CardContent>
      </Card>

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Apariencia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tema_oscuro">Tema Oscuro</Label>
              <p className="text-sm text-slate-600">Activar modo oscuro para la interfaz</p>
            </div>
            <Switch
              id="tema_oscuro"
              checked={localConfig.tema_oscuro}
              onCheckedChange={(checked) => updateConfigValue('tema_oscuro', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idioma_interfaz">Idioma de la Interfaz</Label>
            <Select 
              value={localConfig.idioma_interfaz} 
              onValueChange={(value) => updateConfigValue('idioma_interfaz', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Formato de Números */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Formato de Números</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="formato_numeros">Formato Regional</Label>
              <Select 
                value={localConfig.formato_numeros} 
                onValueChange={(value) => updateConfigValue('formato_numeros', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es-AR">Español (Argentina)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="es-ES">Español (España)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimales_moneda">Decimales para Moneda</Label>
              <Input
                id="decimales_moneda"
                type="number"
                min="0"
                max="4"
                value={localConfig.decimales_moneda}
                onChange={(e) => updateConfigValue('decimales_moneda', parseInt(e.target.value) || 2)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="separador_miles">Separador de Miles</Label>
              <Select 
                value={localConfig.separador_miles} 
                onValueChange={(value) => updateConfigValue('separador_miles', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=".">Punto (.)</SelectItem>
                  <SelectItem value=",">Coma (,)</SelectItem>
                  <SelectItem value=" ">Espacio ( )</SelectItem>
                  <SelectItem value="none">Ninguno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="separador_decimal">Separador Decimal</Label>
              <Select 
                value={localConfig.separador_decimal} 
                onValueChange={(value) => updateConfigValue('separador_decimal', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Coma (,)</SelectItem>
                  <SelectItem value=".">Punto (.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Vista previa:</strong> 
              {` ${(1234567.89).toLocaleString(localConfig.formato_numeros, {
                minimumFractionDigits: localConfig.decimales_moneda,
                maximumFractionDigits: localConfig.decimales_moneda
              })}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Gestión de Configuración</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>

            <Button variant="outline" onClick={handleExportar} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar Configuración
            </Button>

            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImportar}
                className="hidden"
                id="import-config"
              />
              <label htmlFor="import-config">
                <Button variant="outline" asChild disabled={isImporting}>
                  <span className="cursor-pointer">
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Importar Configuración
                  </span>
                </Button>
              </label>
            </div>

            <Button 
              variant="outline" 
              onClick={handleResetear} 
              disabled={isResetting}
              className="text-red-600 hover:text-red-700"
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Resetear a Valores por Defecto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
