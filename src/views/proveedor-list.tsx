"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { SearchBar } from "@/views/ui/search-bar"
import { Eye, Edit, CheckCircle, XCircle, Loader2, Building2, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useProveedores } from "@/shared/use-proveedores"
import { EstadoProveedor } from "@/models"
import { searchWithScore } from "@/shared/search-utils"
import { StatusBadge } from "@/shared/status-badge"

export function ProveedorList() {
  const { proveedores, loading, error, activarProveedor, suspenderProveedor } = useProveedores()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // buscamos solo por los campos que realmente existen en el formulario/base
  const filteredProveedores = searchWithScore(
    proveedores,
    searchTerm,
    ["nombre", "cuit", "email", "telefono", "direccion"],
    {
      nombre: 3,
      cuit: 3,
      email: 2,
      telefono: 1,
      direccion: 1,
    }
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
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre, CUIT, email..."
            className="w-80"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredProveedores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {searchTerm
                  ? `No se encontraron proveedores que coincidan con "${searchTerm}"`
                  : "No hay proveedores registrados"}
              </p>
            </div>
          ) : (
            filteredProveedores.map((proveedor) => (
              <div
                key={proveedor.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* columnas */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Información Principal */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-slate-600" />
                        <h3 className="font-medium text-slate-900">
                          {proveedor.nombre || "—"}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-600">
                        CUIT: {proveedor.cuit || "—"}
                      </p>
                      {proveedor.estado && (
                        <StatusBadge estado={proveedor.estado} showIcon />
                      )}
                    </div>

                    {/* Información de Contacto */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-700">
                          {proveedor.email || "Sin email"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-700">
                          {proveedor.telefono || "Sin teléfono"}
                        </span>
                      </div>
                    </div>

                    {/* Ubicación / Dirección */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-700">
                          {proveedor.direccion || "Sin dirección"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-2">
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
