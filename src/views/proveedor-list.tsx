"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Badge } from "@/views/ui/badge"
import { Input } from "@/views/ui/input"
import { Eye, Edit, CheckCircle, XCircle, Loader2, Building2, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useProveedores } from "@/shared/use-proveedores"
import { EstadoProveedor } from "@/models"

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

export function ProveedorList() {
  const { proveedores, loading, error, activarProveedor, suspenderProveedor } = useProveedores()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.rut.includes(searchTerm) ||
    proveedor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleActivar = async (id: string) => {
    try {
      setProcessingId(id)
      await activarProveedor(id)
    } catch (error) {
      console.error("Error al activar proveedor:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleSuspender = async (id: string) => {
    try {
      setProcessingId(id)
      await suspenderProveedor(id)
    } catch (error) {
      console.error("Error al suspender proveedor:", error)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando proveedores...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-red-600">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Proveedores ({filteredProveedores.length})</CardTitle>
          <div className="w-72">
            <Input
              placeholder="Buscar por nombre, RUT, email o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredProveedores.length === 0 ? (
            <p className="text-center text-slate-500 py-8">
              {searchTerm ? "No se encontraron proveedores con ese criterio" : "No hay proveedores registrados"}
            </p>
          ) : (
            filteredProveedores.map((proveedor) => (
              <div 
                key={proveedor.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Información Principal */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-slate-600" />
                        <h3 className="font-medium text-slate-900">{proveedor.nombre}</h3>
                      </div>
                      <p className="text-sm text-slate-600">RUT: {proveedor.rut}</p>
                      <Badge className={getEstadoColor(proveedor.estado)}>
                        {proveedor.estado}
                      </Badge>
                    </div>

                    {/* Información de Contacto */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-700">{proveedor.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-700">{proveedor.telefono}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-700">{proveedor.ciudad}, {proveedor.pais}</span>
                      </div>
                    </div>

                    {/* Información Adicional */}
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Contacto:</span> {proveedor.contacto_principal}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Dirección:</span> {proveedor.direccion}
                      </p>
                      {proveedor.sitio_web && (
                        <a 
                          href={proveedor.sitio_web} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Sitio Web
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/proveedores/${proveedor.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/proveedores/${proveedor.id}/editar`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    
                    {proveedor.estado === EstadoProveedor.ACTIVO ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSuspender(proveedor.id)}
                        disabled={processingId === proveedor.id}
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleActivar(proveedor.id)}
                        disabled={processingId === proveedor.id}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
