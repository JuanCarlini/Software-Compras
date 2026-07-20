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
import { formatCurrency } from "@/shared/format-utils"

// Reescrito para el circuito CCIP (2026-07-08). La factura tiene líneas de detalle (LFACT)
// e imputa un MONTO a certificaciones aprobadas del proveedor (N:M con monto_asignado).
// Regla dura (fn_check_imputacion, en la DB): solo certs aprobadas y Σ monto_asignado ≤ el
// total de las líneas. Los totales los calcula el server. numero_factura lo pone la DB.
// TODO(frontend): funcional pero crudo; el rediseño va aparte.

interface CertAprobada {
  id: number
  numero_cert: string
  total_con_iva: number
}
interface LineaFactura {
  descripcion: string
  cantidad: number
  precio_unitario: number
  iva_porcentaje: number
}

export function FacturaForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proveedores, setProveedores] = useState<any[]>([])
  const [certificaciones, setCertificaciones] = useState<CertAprobada[]>([])

  const [proveedorId, setProveedorId] = useState("")
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().slice(0, 10))
  const [numeroComprobante, setNumeroComprobante] = useState("")
  const [puntoVenta, setPuntoVenta] = useState("")

  const [lineas, setLineas] = useState<LineaFactura[]>([
    { descripcion: "", cantidad: 1, precio_unitario: 0, iva_porcentaje: 21 },
  ])
  // certId -> monto imputado (texto del input)
  const [imputaciones, setImputaciones] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch("/api/proveedores")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProveedores)
      .catch(() => setProveedores([]))
  }, [])

  useEffect(() => {
    if (!proveedorId) {
      setCertificaciones([])
      setImputaciones({})
      return
    }
    fetch(`/api/facturas/certificaciones-aprobadas?proveedorId=${proveedorId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCertificaciones)
      .catch(() => setCertificaciones([]))
    setImputaciones({})
  }, [proveedorId])

  const totalLineas = lineas.reduce(
    (a, l) => a + l.cantidad * l.precio_unitario * (1 + l.iva_porcentaje / 100),
    0
  )
  const totalImputado = Object.values(imputaciones).reduce((a, v) => a + (Number(v) || 0), 0)

  const setLinea = (i: number, patch: Partial<LineaFactura>) =>
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!proveedorId) return setError("Elegí un proveedor")
    if (lineas.some((l) => !l.descripcion || l.cantidad <= 0)) {
      return setError("Completá descripción y cantidad de cada línea")
    }
    // Pre-validación del tope; el trigger fn_check_imputacion es el que garantiza la regla.
    if (totalImputado > totalLineas + 0.01) {
      return setError(
        `Lo imputado (${formatCurrency(totalImputado)}) supera el total de líneas (${formatCurrency(totalLineas)})`
      )
    }

    const imputacionesPayload = Object.entries(imputaciones)
      .filter(([, monto]) => Number(monto) > 0)
      .map(([certId, monto]) => ({ certificacion_id: Number(certId), monto_asignado: Number(monto) }))

    setLoading(true)
    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor_id: Number(proveedorId),
          fecha_emision: fechaEmision,
          numero_comprobante: numeroComprobante || null,
          punto_venta: puntoVenta || null,
          lineas,
          imputaciones: imputacionesPayload,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || "Error al crear la factura")

      showSuccessToast("Factura creada", body.numero_factura)
      router.push(`/facturas/${body.id}`)
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido"
      setError(mensaje)
      showErrorToast("No se pudo crear la factura", mensaje)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Nueva factura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={proveedorId} onValueChange={setProveedorId} disabled={loading}>
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
            <div className="space-y-2">
              <Label htmlFor="fecha_emision">Fecha de emisión *</Label>
              <Input
                id="fecha_emision"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="punto_venta">Punto de venta</Label>
              <Input id="punto_venta" value={puntoVenta} onChange={(e) => setPuntoVenta(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_comprobante">N° de comprobante</Label>
              <Input
                id="numero_comprobante"
                value={numeroComprobante}
                onChange={(e) => setNumeroComprobante(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Líneas</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLineas((p) => [...p, { descripcion: "", cantidad: 1, precio_unitario: 0, iva_porcentaje: 21 }])}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" /> Agregar línea
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineas.map((linea, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-b pb-3">
              <div className="md:col-span-5 space-y-1">
                <Label>Descripción</Label>
                <Input value={linea.descripcion} onChange={(e) => setLinea(i, { descripcion: e.target.value })} disabled={loading} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Cantidad</Label>
                <Input type="number" min="0" step="0.01" value={linea.cantidad} onChange={(e) => setLinea(i, { cantidad: Number(e.target.value) })} disabled={loading} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Precio</Label>
                <Input type="number" min="0" step="0.01" value={linea.precio_unitario} onChange={(e) => setLinea(i, { precio_unitario: Number(e.target.value) })} disabled={loading} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>IVA %</Label>
                <Input type="number" min="0" max="100" step="0.01" value={linea.iva_porcentaje} onChange={(e) => setLinea(i, { iva_porcentaje: Number(e.target.value) })} disabled={loading} />
              </div>
              <div className="md:col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => setLineas((p) => p.filter((_, idx) => idx !== i))} disabled={loading || lineas.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end text-sm">
            Total facturado: <strong className="ml-2">{formatCurrency(totalLineas)}</strong>
          </div>
        </CardContent>
      </Card>

      {certificaciones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imputar a certificaciones aprobadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              La suma imputada no puede superar el total de las líneas. Dejá en 0 lo que no imputes.
            </p>
            {certificaciones.map((cert) => (
              <div key={cert.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end border-b pb-2">
                <div className="md:col-span-2">
                  <p className="font-mono text-sm">{cert.numero_cert}</p>
                  <p className="text-xs text-muted-foreground">Certificado: {formatCurrency(cert.total_con_iva)}</p>
                </div>
                <div className="space-y-1">
                  <Label>Monto a imputar</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={imputaciones[cert.id] ?? ""}
                    onChange={(e) => setImputaciones((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                    disabled={loading}
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end text-sm">
              <span className={totalImputado > totalLineas + 0.01 ? "text-red-600" : ""}>
                Total imputado: <strong>{formatCurrency(totalImputado)}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear factura
        </Button>
      </div>
    </form>
  )
}
