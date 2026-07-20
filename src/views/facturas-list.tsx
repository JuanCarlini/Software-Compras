"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/views/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Badge } from "@/views/ui/badge"
import { Plus, Receipt, Calendar, Building2, Loader2 } from "lucide-react"
import { showErrorToast } from "@/shared/toast-helpers"
import { StatusBadge } from "@/shared/status-badge"

export function FacturasList() {
  const [facturas, setFacturas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudieron cargar las facturas"
      setError(msg)
      showErrorToast("Error", msg)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando facturas...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
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
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay facturas
            </h3>
            <p className="text-muted-foreground mb-4">
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
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
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
                        <span>
                          {factura.fecha_emision
                            ? new Date(factura.fecha_emision).toLocaleDateString('es-AR')
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge estado={factura.estado} showIcon />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        ${factura.total_con_iva?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-muted-foreground">
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
