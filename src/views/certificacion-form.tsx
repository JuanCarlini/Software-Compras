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
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"

// Línea de OC aprobada con saldo certificable (ver CertificacionService.getLineasOCDisponibles)
interface LineaOCDisponible {
  id: number
  descripcion: string
  cantidad: number
  precio_unitario_neto: number
  iva_porcentaje: number
  numero_oc: string
  orden_compra_id: number
  cantidad_certificada: number
  cantidad_disponible: number
}

export function CertificacionForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [proyectos, setProyectos] = useState<any[]>([])
  const [proveedores, setProveedores] = useState<any[]>([])
  const [lineasOC, setLineasOC] = useState<LineaOCDisponible[]>([])

  // campos que realmente existen en gu_certificaciones
  const [formData, setFormData] = useState({
    proyecto_id: "",
    proveedor_id: "",
    fecha_cert: "",
    observaciones: "",
    estado: "borrador",
  })

  // líneas que se guardan en gu_lineasdecertificacion
  // linea_oc_id: null = línea libre; con valor = certifica contra esa línea de OC (regla del 100%)
  const [lineas, setLineas] = useState<
    Array<{
      linea_oc_id: number | null
      descripcion: string
      cantidad: number
      precio_unitario: number
      iva_porcentaje: number
    }>
  >([
    {
      linea_oc_id: null,
      descripcion: "",
      cantidad: 1,
      precio_unitario: 0,
      iva_porcentaje: 21,
    },
  ])

  // al cambiar el proveedor, cargar sus líneas de OC aprobadas con saldo
  // y desvincular las líneas ya cargadas (pertenecían a otro proveedor)
  useEffect(() => {
    if (!formData.proveedor_id) {
      setLineasOC([])
      return
    }
    setLineas((prev) => prev.map((l) => ({ ...l, linea_oc_id: null })))
    fetch(`/api/certificaciones/lineas-oc-disponibles?proveedorId=${formData.proveedor_id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setLineasOC)
      .catch(() => setLineasOC([]))
  }, [formData.proveedor_id])

  const vincularLineaOC = (index: number, valor: string) => {
    if (valor === "libre") {
      setLineas((prev) => prev.map((l, i) => (i === index ? { ...l, linea_oc_id: null } : l)))
      return
    }
    const lineaOC = lineasOC.find((l) => l.id === Number(valor))
    if (!lineaOC) return
    setLineas((prev) =>
      prev.map((l, i) =>
        i === index
          ? {
              ...l,
              linea_oc_id: lineaOC.id,
              descripcion: l.descripcion || lineaOC.descripcion,
              precio_unitario: lineaOC.precio_unitario_neto,
              iva_porcentaje: lineaOC.iva_porcentaje,
              cantidad: Math.min(l.cantidad || 1, lineaOC.cantidad_disponible),
            }
          : l,
      ),
    )
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proyRes, provRes] = await Promise.all([
          fetch("/api/proyectos"),
          fetch("/api/proveedores"),
        ])

        if (proyRes.ok) setProyectos(await proyRes.json())
        if (provRes.ok) setProveedores(await provRes.json())
      } catch (err) {
        console.error("Error cargando combos:", err)
      }
    }

    fetchData()
  }, [])

  const agregarLinea = () => {
    setLineas((prev) => [
      ...prev,
      { linea_oc_id: null, descripcion: "", cantidad: 1, precio_unitario: 0, iva_porcentaje: 21 },
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
    let total_con_iva = 0

    lineas.forEach((l) => {
      const neto = l.cantidad * l.precio_unitario
      const iva = neto * (l.iva_porcentaje / 100)
      total_neto += neto
      total_con_iva += neto + iva
    })

    return { total_neto, total_con_iva }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // al menos 1 línea con descripción
    const lineasValidas = lineas.filter((l) => l.descripcion.trim() !== "")
    if (lineasValidas.length === 0) {
      showErrorToast("Error", "Agrega al menos una línea de certificación")
      return
    }

    // pre-validación de la regla del 100% (la garantía real es el trigger en la DB):
    // suma por línea de OC dentro del formulario vs saldo disponible
    const porLineaOC = new Map<number, number>()
    for (const l of lineasValidas) {
      if (l.linea_oc_id != null) {
        porLineaOC.set(l.linea_oc_id, (porLineaOC.get(l.linea_oc_id) || 0) + l.cantidad)
      }
    }
    for (const [lineaOcId, cantidadTotal] of porLineaOC) {
      const lineaOC = lineasOC.find((l) => l.id === lineaOcId)
      if (lineaOC && cantidadTotal > lineaOC.cantidad_disponible) {
        showErrorToast(
          "Se supera el 100% de la línea de OC",
          `${lineaOC.numero_oc} · ${lineaOC.descripcion}: disponible ${lineaOC.cantidad_disponible}, se intentó certificar ${cantidadTotal}`,
        )
        return
      }
    }

    setLoading(true)
    try {
      const { total_neto, total_con_iva } = calcularTotales()

      // mapeamos líneas al formato exacto de la tabla
      const lineasPayload = lineasValidas.map((l) => {
        const neto = l.cantidad * l.precio_unitario
        const totalConIva = neto + neto * (l.iva_porcentaje / 100)
        return {
          linea_oc_id: l.linea_oc_id,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          iva_porcentaje: l.iva_porcentaje,
          total_neto: neto,
          total_con_iva: totalConIva,
          estado: formData.estado, // coincide con la columna estado de la línea
        }
      })

      const payload = {
        // numero_cert NO se manda, lo hace el backend
        proyecto_id: Number(formData.proyecto_id),
        proveedor_id: Number(formData.proveedor_id),
        fecha_cert: formData.fecha_cert, // es date en la tabla
        observaciones: formData.observaciones,
        total_neto,
        total_con_iva,
        estado: formData.estado,
        lineas: lineasPayload,
      }

      const res = await fetch("/api/certificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Error al crear certificación")
      }

      showSuccessToast("Certificación creada", "La certificación se creó correctamente")
      router.push("/certificaciones")
    } catch (err: any) {
      console.error("Error creando certificación:", err)
      showErrorToast("Error", err.message ?? "No se pudo crear la certificación")
    } finally {
      setLoading(false)
    }
  }

  const { total_neto, total_con_iva } = calcularTotales()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CABECERA */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Certificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Fecha de certificación *</Label>
              <Input
                type="date"
                value={formData.fecha_cert}
                onChange={(e) => setFormData({ ...formData, fecha_cert: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(v) => setFormData({ ...formData, estado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrador">borrador</SelectItem>
                  <SelectItem value="aprobado">aprobado</SelectItem>
                  <SelectItem value="rechazado">rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Proyecto *</Label>
              <Select
                value={formData.proyecto_id}
                onValueChange={(v) => setFormData({ ...formData, proyecto_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {proyectos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.codigo ? `${p.codigo} - ${p.nombre}` : p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proveedor *</Label>
              <Select
                value={formData.proveedor_id}
                onValueChange={(v) => setFormData({ ...formData, proveedor_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
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
          </div>

          <div>
            <Label>Observaciones</Label>
            <Textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* LÍNEAS */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Líneas de certificación</CardTitle>
          <Button type="button" size="sm" onClick={agregarLinea}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar línea
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Estos campos se guardan directamente en <code>gu_lineasdecertificacion</code>.
            </AlertDescription>
          </Alert>

          {lineas.map((linea, index) => {
            const lineaOCVinculada = linea.linea_oc_id != null
              ? lineasOC.find((l) => l.id === linea.linea_oc_id)
              : undefined
            return (
            <div key={index} className="space-y-3 border rounded-lg p-4">
              {formData.proveedor_id && (
                <div>
                  <Label>Línea de OC</Label>
                  <Select
                    value={linea.linea_oc_id != null ? String(linea.linea_oc_id) : "libre"}
                    onValueChange={(v) => vincularLineaOC(index, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="libre">Línea libre (sin OC)</SelectItem>
                      {lineasOC.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)} disabled={l.cantidad_disponible <= 0 && l.id !== linea.linea_oc_id}>
                          {l.numero_oc} · {l.descripcion} (disponible {l.cantidad_disponible} de {l.cantidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-12 gap-3">
              <div className="col-span-5">
                <Label>Descripción *</Label>
                <Input
                  value={linea.descripcion}
                  onChange={(e) => actualizarLinea(index, "descripcion", e.target.value)}
                  placeholder="Detalle del concepto certificado"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  min={0}
                  max={lineaOCVinculada ? lineaOCVinculada.cantidad_disponible : undefined}
                  step="0.01"
                  value={linea.cantidad}
                  onChange={(e) => actualizarLinea(index, "cantidad", e.target.value)}
                />
                {lineaOCVinculada && (
                  <p className={`text-xs mt-1 ${linea.cantidad > lineaOCVinculada.cantidad_disponible ? "text-red-600" : "text-slate-500"}`}>
                    Disponible: {lineaOCVinculada.cantidad_disponible}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Precio unitario *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={linea.precio_unitario}
                  onChange={(e) => actualizarLinea(index, "precio_unitario", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>IVA %</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={linea.iva_porcentaje}
                  onChange={(e) => actualizarLinea(index, "iva_porcentaje", e.target.value)}
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => eliminarLinea(index)}
                  disabled={lineas.length === 1}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
              </div>
            </div>
            )
          })}

          {/* Totales */}
          <div className="border-t pt-4 flex justify-end gap-8">
            <div>
              <p className="text-sm text-slate-600">Total Neto</p>
              <p className="text-xl font-bold">${total_neto.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total con IVA</p>
              <p className="text-2xl font-bold text-green-600">${total_con_iva.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear certificación
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/certificaciones")}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
