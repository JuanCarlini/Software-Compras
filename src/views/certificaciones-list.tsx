"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/views/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Plus, FileText, Calendar, Building2 } from "lucide-react"
import { showErrorToast } from "@/shared/toast-helpers"
import { StatusBadge } from "@/shared/status-badge"

export function CertificacionesList() {
  const [certificaciones, setCertificaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCertificaciones()
  }, [])

  const fetchCertificaciones = async () => {
    try {
      const response = await fetch('/api/certificaciones')
      if (!response.ok) throw new Error('Error al cargar certificaciones')
      const data = await response.json()
      setCertificaciones(data)
    } catch (error) {
      showErrorToast("Error", "No se pudieron cargar las certificaciones")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando certificaciones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button onClick={() => router.push('/certificaciones/nueva')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Certificación
          </Button>
        </div>
      </div>

      {certificaciones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No hay certificaciones
            </h3>
            <p className="text-slate-600 mb-4">
              Comienza creando tu primera certificación
            </p>
            <Button onClick={() => router.push('/certificaciones/nueva')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Certificación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certificaciones.map((cert) => (
            <Card 
              key={cert.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/certificaciones/${cert.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {cert.numero_cert}
                    </CardTitle>
                    <div className="flex flex-col gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{cert.proyecto_nombre || 'Sin proyecto'}</span>
                        {cert.proyecto_codigo && (
                          <Badge variant="outline" className="ml-2">
                            {cert.proyecto_codigo}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{cert.proveedor_nombre || 'Sin proveedor'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(cert.fecha_cert).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge estado={cert.estado} showIcon />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        ${cert.total_con_iva?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-slate-600">
                        Total con IVA
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
