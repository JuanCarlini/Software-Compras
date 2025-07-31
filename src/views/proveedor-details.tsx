"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { Separator } from "@/views/ui/separator"
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  User, 
  FileText,
  Edit,
  ArrowLeft,
  CheckCircle,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { Proveedor, EstadoProveedor } from "@/models"
import { useState } from "react"

interface Props {
  proveedor: Proveedor
  onActivar?: () => Promise<void>
  onSuspender?: () => Promise<void>
}

const getEstadoColor = (estado: EstadoProveedor) => {
  switch (estado) {
    case EstadoProveedor.ACTIVO:
      return "bg-green-100 text-green-800"
    case EstadoProveedor.INACTIVO:
      return "bg-gray-100 text-gray-800"
    case EstadoProveedor.SUSPENDIDO:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function ProveedorDetails({ proveedor, onActivar, onSuspender }: Props) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleActivar = async () => {
    if (!onActivar) return
    try {
      setIsProcessing(true)
      await onActivar()
    } catch (error) {
      console.error("Error al activar proveedor:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuspender = async () => {
    if (!onSuspender) return
    try {
      setIsProcessing(true)
      await onSuspender()
    } catch (error) {
      console.error("Error al suspender proveedor:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/proveedores">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{proveedor.nombre}</h1>
            <p className="text-slate-600">RUT: {proveedor.rut}</p>
          </div>
          <Badge className={getEstadoColor(proveedor.estado)}>
            {proveedor.estado}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/proveedores/${proveedor.id}/editar`}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
          
          {proveedor.estado === EstadoProveedor.ACTIVO ? (
            <Button 
              variant="outline"
              onClick={handleSuspender}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Suspender
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={handleActivar}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Activar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Información Básica</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Nombre de la Empresa</p>
                  <p className="text-slate-900">{proveedor.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">RUT</p>
                  <p className="text-slate-900">{proveedor.rut}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Contacto Principal</p>
                  <p className="text-slate-900">{proveedor.contacto_principal}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Estado</p>
                  <Badge className={getEstadoColor(proveedor.estado)}>
                    {proveedor.estado}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Información de Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Email</p>
                    <a 
                      href={`mailto:${proveedor.email}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {proveedor.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Teléfono</p>
                    <a 
                      href={`tel:${proveedor.telefono}`} 
                      className="text-blue-600 hover:underline"
                    >
                      {proveedor.telefono}
                    </a>
                  </div>
                </div>

                {proveedor.sitio_web && (
                  <div className="flex items-center space-x-3 md:col-span-2">
                    <Globe className="h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Sitio Web</p>
                      <a 
                        href={proveedor.sitio_web} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {proveedor.sitio_web}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de Ubicación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Ubicación</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Dirección</p>
                  <p className="text-slate-900">{proveedor.direccion}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Ciudad</p>
                    <p className="text-slate-900">{proveedor.ciudad}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">País</p>
                    <p className="text-slate-900">{proveedor.pais}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {proveedor.notas && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Notas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 whitespace-pre-wrap">{proveedor.notas}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Fecha de Creación</p>
                <p className="text-sm text-slate-600">{formatDate(proveedor.created_at)}</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm font-medium text-slate-700">Última Actualización</p>
                <p className="text-sm text-slate-600">{formatDate(proveedor.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/ordenes-compra/nueva?proveedor=${proveedor.id}`}>
                  Crear Orden de Compra
                </Link>
              </Button>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/ordenes-pago/nueva?proveedor=${proveedor.id}`}>
                  Crear Orden de Pago
                </Link>
              </Button>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/reportes/proveedor/${proveedor.id}`}>
                  Ver Reportes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
