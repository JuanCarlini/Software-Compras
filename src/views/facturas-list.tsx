"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/views/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Plus, Receipt, Calendar, Building2 } from "lucide-react"
import { showErrorToast } from "@/shared/toast-helpers"
import { StatusBadge } from "@/shared/status-badge"

export function FacturasList() {
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchFacturas()
  }, [])

  const fetchFacturas = async () => {
    try {
      const response = await fetch('/api/facturas')
      if (!response.ok) throw new Error('Error al cargar facturas')
      const data = await response.json()
      setFacturas(data)
    } catch (error) {
      showErrorToast("Error", "No se pudieron cargar las facturas")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando facturas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button onClick={() => router.push('/facturas/nueva')}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {facturas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No hay facturas
            </h3>
            <p className="text-slate-600 mb-4">
              Comienza creando tu primera factura
            </p>
            <Button onClick={() => router.push('/facturas/nueva')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {facturas.map((factura) => (
            <Card 
              key={factura.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/facturas/${factura.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {factura.numero_factura}
                    </CardTitle>
                    <div className="flex flex-col gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{factura.proveedor_nombre || 'Sin proveedor'}</span>
                        {factura.proveedor_cuit && (
                          <Badge variant="outline" className="ml-2">
                            {factura.proveedor_cuit}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(factura.fecha_factura).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge estado={factura.estado} showIcon />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        ${factura.total_con_iva?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
