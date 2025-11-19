"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/views/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Textarea } from "@/views/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { Checkbox } from "@/views/ui/checkbox"
import { Badge } from "@/views/ui/badge"
import { Loader2, Plus, Trash2, AlertCircle, FileCheck } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"

export function FacturaForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [proveedores, setProveedores] = useState<any[]>([])
  const [certificacionesAprobadas, setCertificacionesAprobadas] = useState<any[]>([])
  const [loadingCertificaciones, setLoadingCertificaciones] = useState(false)

  const [formData, setFormData] = useState({
    proveedor_id: "",
    fecha_factura: "",
    estado: "borrador",
  })

  const [certificacionesSeleccionadas, setCertificacionesSeleccionadas] = useState<number[]>([])

  const [lineas, setLineas] = useState<
    Array<{
      descripcion: string
      cantidad: number
      precio_unitario: number
      iva_porcentaje: number
    }>
  >([
    {
      descripcion: "",
      cantidad: 1,
      precio_unitario: 0,
      iva_porcentaje: 21,
    },
  ])

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const res = await fetch("/api/proveedores")
        if (res.ok) setProveedores(await res.json())
      } catch (err) {
        console.error("Error cargando proveedores:", err)
      }
    }

    fetchProveedores()
  }, [])

  useEffect(() => {
    if (formData.proveedor_id) {
      fetchCertificacionesAprobadas()
    } else {
      setCertificacionesAprobadas([])
      setCertificacionesSeleccionadas([])
    }
  }, [formData.proveedor_id])

  const fetchCertificacionesAprobadas = async () => {
    setLoadingCertificaciones(true)
    try {
      const res = await fetch(`/api/facturas/certificaciones-aprobadas?proveedorId=${formData.proveedor_id}`)
      if (res.ok) {
        const data = await res.json()
        setCertificacionesAprobadas(data)
      }
    } catch (err) {
      console.error("Error cargando certificaciones:", err)
    } finally {
      setLoadingCertificaciones(false)
    }
  }

  const toggleCertificacion = (certId: number) => {
    setCertificacionesSeleccionadas(prev => 
      prev.includes(certId) 
        ? prev.filter(id => id !== certId)
        : [...prev, certId]
    )
  }

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      { descripcion: "", cantidad: 1, precio_unitario: 0, iva_porcentaje: 21 },
    ])
  }

  const eliminarLinea = (index: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== index))
  }

  const actualizarLinea = (index: number, campo: string, valor: any) => {
    setLineas((prev) =>
      prev.map((l, i) =>
        i === index
          ? {
              ...l,
              [campo]:
                campo === "cantidad" || campo === "precio_unitario" || campo === "iva_porcentaje"
                  ? Number(valor) || 0
                  : valor,
            }
          : l,
      ),
    )
  }

  const calcularTotales = () => {
    let total_neto = 0
    let total_iva = 0

    lineas.forEach((l) => {
      const neto = l.cantidad * l.precio_unitario
      const iva = neto * (l.iva_porcentaje / 100)
      total_neto += neto
      total_iva += iva
    })

    return { total_neto, total_iva, total_con_iva: total_neto + total_iva }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.proveedor_id) {
      showErrorToast("Error", "Selecciona un proveedor")
      return
    }

    if (!formData.fecha_factura) {
      showErrorToast("Error", "Ingresa la fecha de la factura")
      return
    }

    const lineasValidas = lineas.filter((l) => l.descripcion.trim() !== "")
    if (lineasValidas.length === 0) {
      showErrorToast("Error", "Agrega al menos una línea en la factura")
      return
    }

    setLoading(true)
    try {
      const { total_neto, total_iva, total_con_iva } = calcularTotales()

      const lineasPayload = lineasValidas.map((l) => {
        const neto = l.cantidad * l.precio_unitario
        const iva = neto * (l.iva_porcentaje / 100)
        const totalConIva = neto + iva
        return {
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          iva_porcentaje: l.iva_porcentaje,
          total_neto: neto,
          total_con_iva: totalConIva,
          estado: formData.estado,
        }
      })

      const payload = {
        proveedor_id: Number(formData.proveedor_id),
        fecha_factura: formData.fecha_factura,
        total_neto,
        total_iva,
        total_con_iva,
        estado: formData.estado,
        lineas: lineasPayload,
        certificaciones_ids: certificacionesSeleccionadas,
      }

      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Error al crear la factura")

      const nuevaFactura = await res.json()
      showSuccessToast("Éxito", "Factura creada correctamente")
      router.push(`/facturas/${nuevaFactura.id}`)
    } catch (error) {
      console.error("Error:", error)
      showErrorToast("Error", "No se pudo crear la factura")
    } finally {
      setLoading(false)
    }
  }

  const { total_neto, total_iva, total_con_iva } = calcularTotales()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de la Factura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proveedor_id">Proveedor *</Label>
              <Select
                value={formData.proveedor_id}
                onValueChange={(val) => setFormData({ ...formData, proveedor_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fecha_factura">Fecha de Factura *</Label>
              <Input
                id="fecha_factura"
                type="date"
                value={formData.fecha_factura}
                onChange={(e) => setFormData({ ...formData, fecha_factura: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(val) => setFormData({ ...formData, estado: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {formData.proveedor_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Certificaciones Aprobadas del Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCertificaciones ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-slate-600 mt-2">Cargando certificaciones...</p>
              </div>
            ) : certificacionesAprobadas.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay certificaciones aprobadas para este proveedor
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {certificacionesAprobadas.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={certificacionesSeleccionadas.includes(cert.id)}
                        onCheckedChange={() => toggleCertificacion(cert.id)}
                      />
                      <div>
                        <div className="font-medium">{cert.numero_cert}</div>
                        <div className="text-sm text-slate-600">
                          Fecha: {new Date(cert.fecha_cert).toLocaleDateString('es-AR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge>Aprobado</Badge>
                      <div className="text-sm font-medium mt-1">
                        ${cert.total_con_iva?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Líneas de la Factura</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={agregarLinea}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Línea
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineas.map((linea, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Línea {index + 1}</h4>
                {lineas.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminarLinea(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-4">
                  <Label>Descripción</Label>
                  <Input
                    value={linea.descripcion}
                    onChange={(e) => actualizarLinea(index, "descripcion", e.target.value)}
                    placeholder="Descripción del ítem"
                  />
                </div>

                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={linea.cantidad}
                    onChange={(e) => actualizarLinea(index, "cantidad", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={linea.precio_unitario}
                    onChange={(e) => actualizarLinea(index, "precio_unitario", e.target.value)}
                  />
                </div>

                <div>
                  <Label>IVA (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={linea.iva_porcentaje}
                    onChange={(e) => actualizarLinea(index, "iva_porcentaje", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Total</Label>
                  <Input
                    readOnly
                    value={(
                      linea.cantidad * linea.precio_unitario +
                      linea.cantidad * linea.precio_unitario * (linea.iva_porcentaje / 100)
                    ).toFixed(2)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-lg">
            <span>Subtotal (Neto):</span>
            <span className="font-semibold">${total_neto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>IVA:</span>
            <span className="font-semibold">${total_iva.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-2">
            <span>Total con IVA:</span>
            <span>${total_con_iva.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Factura
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/facturas')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
