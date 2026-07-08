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
import { Loader2, AlertCircle } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"
import { formatCurrency } from "@/shared/format-utils"

// Reescrito para el circuito CCIP (2026-07-08). La certificación cuelga de UNA orden de
// compra aprobada: el proveedor y la moneda los hereda, no se eligen. La única entrada por
// línea es el AVANCE EN UNIDADES — avance $, % e IVA los deriva el trigger fn_lce_derive,
// y el tope del 100% lo aplica fn_check_avance_100 (acá solo se muestra el saldo).
// TODO(frontend): esto es funcional pero crudo; el rediseño (wizard) va aparte.

interface OrdenCompraAprobada {
  id: number
  numero_oc: string
  estado: string
  moneda: string
  total_con_iva: number
}

interface LineaOCDisponible {
  id: number
  numero_loc: string
  descripcion: string
  unidad_medida: string | null
  cantidad: number
  precio_unitario_neto: number
  iva_porcentaje: number
  cantidad_certificada: number
  cantidad_disponible: number
  estado_certificacion: "sin" | "parcial" | "total"
}

export function CertificacionForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ordenes, setOrdenes] = useState<OrdenCompraAprobada[]>([])
  const [ordenCompraId, setOrdenCompraId] = useState<string>("")
  const [lineasOC, setLineasOC] = useState<LineaOCDisponible[]>([])
  const [avances, setAvances] = useState<Record<number, string>>({})
  const [fechaDevengado, setFechaDevengado] = useState(new Date().toISOString().slice(0, 10))
  const [observaciones, setObservaciones] = useState("")

  // Solo se puede certificar contra una OC aprobada (fn_cert_oc_aprobada lo garantiza).
  useEffect(() => {
    fetch("/api/ordenes-compra")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: OrdenCompraAprobada[]) => setOrdenes(data.filter((o) => o.estado === "aprobado")))
      .catch(() => setOrdenes([]))
  }, [])

  useEffect(() => {
    if (!ordenCompraId) {
      setLineasOC([])
      setAvances({})
      return
    }
    fetch(`/api/certificaciones/lineas-oc-disponibles?ordenCompraId=${ordenCompraId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setLineasOC)
      .catch(() => setLineasOC([]))
    setAvances({})
  }, [ordenCompraId])

  const lineasCargadas = lineasOC
    .map((l) => ({ linea: l, avance: Number(avances[l.id] ?? 0) }))
    .filter(({ avance }) => avance > 0)

  const totalNeto = lineasCargadas.reduce((a, { linea, avance }) => a + avance * linea.precio_unitario_neto, 0)
  const totalConIva = lineasCargadas.reduce(
    (a, { linea, avance }) => a + avance * linea.precio_unitario_neto * (1 + linea.iva_porcentaje / 100),
    0
  )

  // Pre-validación: el tope real lo aplica el trigger y devuelve 422.
  const excedidas = lineasCargadas.filter(({ linea, avance }) => avance > linea.cantidad_disponible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!ordenCompraId) return setError("Elegí una orden de compra")
    if (lineasCargadas.length === 0) return setError("Cargá el avance de al menos una línea")
    if (excedidas.length > 0) {
      return setError(
        `No se puede certificar más del disponible en: ${excedidas.map((x) => x.linea.numero_loc).join(", ")}`
      )
    }

    setLoading(true)
    try {
      const res = await fetch("/api/certificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orden_compra_id: Number(ordenCompraId),
          fecha_devengado: fechaDevengado,
          observaciones: observaciones || null,
          lineas: lineasCargadas.map(({ linea, avance }) => ({
            linea_oc_id: linea.id,
            avance_unidades: avance,
          })),
        }),
      })

      const body = await res.json()
      if (!res.ok) throw new Error(body.error || "Error al crear la certificación")

      showSuccessToast("Certificación creada", body.numero_cert)
      router.push(`/certificaciones/${body.id}`)
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido"
      setError(mensaje)
      showErrorToast("No se pudo crear la certificación", mensaje)
    } finally {
      setLoading(false)
    }
  }

  const ocElegida = ordenes.find((o) => String(o.id) === ordenCompraId)

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
          <CardTitle>Nueva certificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Orden de compra (aprobada) *</Label>
            <Select value={ordenCompraId} onValueChange={setOrdenCompraId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar orden de compra" />
              </SelectTrigger>
              <SelectContent>
                {ordenes.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.numero_oc} — {formatCurrency(o.total_con_iva)} {o.moneda}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ordenes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay órdenes de compra aprobadas. Aprobá una antes de certificar.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_devengado">Fecha de devengado</Label>
              <Input
                id="fecha_devengado"
                type="date"
                value={fechaDevengado}
                onChange={(e) => setFechaDevengado(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {lineasOC.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avance por línea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineasOC.map((linea) => {
              const avance = Number(avances[linea.id] ?? 0)
              const excede = avance > linea.cantidad_disponible
              return (
                <div key={linea.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border-b pb-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{linea.numero_loc}</p>
                    <p className="font-medium">{linea.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(linea.precio_unitario_neto)} / {linea.unidad_medida ?? "u"} · IVA{" "}
                      {linea.iva_porcentaje}%
                    </p>
                  </div>
                  <div className="text-sm">
                    <p>
                      Certificado: <strong>{linea.cantidad_certificada}</strong> de {linea.cantidad}
                    </p>
                    <p className={linea.cantidad_disponible <= 0 ? "text-muted-foreground" : ""}>
                      Disponible: <strong>{linea.cantidad_disponible}</strong>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`avance-${linea.id}`}>Avance (unidades)</Label>
                    <Input
                      id={`avance-${linea.id}`}
                      type="number"
                      min="0"
                      max={linea.cantidad_disponible}
                      step="0.01"
                      value={avances[linea.id] ?? ""}
                      onChange={(e) => setAvances((prev) => ({ ...prev, [linea.id]: e.target.value }))}
                      disabled={loading || linea.cantidad_disponible <= 0}
                      placeholder="0"
                    />
                    {excede && (
                      <p className="text-xs text-red-600">
                        Máximo {linea.cantidad_disponible} (el resto ya está certificado)
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="flex justify-end gap-6 pt-2 text-sm">
              <span>
                Neto: <strong>{formatCurrency(totalNeto)}</strong>
              </span>
              <span>
                Total: <strong>{formatCurrency(totalConIva)}</strong> {ocElegida?.moneda}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || lineasCargadas.length === 0}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear certificación
        </Button>
      </div>
    </form>
  )
}
