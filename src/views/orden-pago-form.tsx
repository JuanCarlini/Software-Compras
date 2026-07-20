"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/views/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/views/ui/select"
import { Alert, AlertDescription } from "@/views/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"
import { formatCurrency } from "@/shared/format-utils"

// Reescrito para el circuito CCIP (2026-07-08). La OP paga N facturas FINALIZADAS del mismo
// proveedor y reparte el total en N cajas de la misma moneda. Regla dura (fn_op_gate, en la
// DB): Σcajas = Σfacturas = total_a_pagar, y todas las cajas de la moneda de la OP; se valida
// al mandar a aprobar. Este form crea la OP y carga facturas + cajas en un POST secuencial;
// después redirige al detalle. TODO(frontend): el wizard real va aparte.

export function OrdenPagoForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [proveedores, setProveedores] = useState<any[]>([])
  const [facturas, setFacturas] = useState<any[]>([])
  const [cajas, setCajas] = useState<any[]>([])

  const [proveedorId, setProveedorId] = useState("")
  const [moneda, setMoneda] = useState("ARS")
  const [fechaOp, setFechaOp] = useState(new Date().toISOString().slice(0, 10))

  // facturaId -> monto a pagar de esa factura (texto)
  const [pagos, setPagos] = useState<Record<number, string>>({})
  // cajaId -> monto desde esa caja (texto)
  const [repartos, setRepartos] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch("/api/proveedores").then((r) => (r.ok ? r.json() : [])).then(setProveedores).catch(() => {})
    fetch("/api/cajas").then((r) => (r.ok ? r.json() : [])).then(setCajas).catch(() => {})
  }, [])

  // Facturas finalizadas del proveedor (las únicas pagables — fn_lop_factura_pagable).
  useEffect(() => {
    if (!proveedorId) {
      setFacturas([])
      setPagos({})
      return
    }
    fetch("/api/facturas")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) =>
        setFacturas(data.filter((f) => f.proveedor_id === Number(proveedorId) && f.estado === "finalizado"))
      )
      .catch(() => setFacturas([]))
    setPagos({})
  }, [proveedorId])

  const cajasDeLaMoneda = cajas.filter((c) => c.moneda === moneda)
  const totalFacturas = Object.values(pagos).reduce((a, v) => a + (Number(v) || 0), 0)
  const totalCajas = Object.values(repartos).reduce((a, v) => a + (Number(v) || 0), 0)
  const sumasCoinciden = Math.abs(totalFacturas - totalCajas) < 0.01 && totalFacturas > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!proveedorId) return setError("Elegí un proveedor")
    const facturasPayload = Object.entries(pagos).filter(([, m]) => Number(m) > 0)
    if (facturasPayload.length === 0) return setError("Cargá el monto de al menos una factura")
    // Pre-validación de la regla dura; el gate fn_op_gate es el que la garantiza.
    if (!sumasCoinciden) {
      return setError(
        `El total de las cajas (${formatCurrency(totalCajas)}) debe igualar el de las facturas (${formatCurrency(totalFacturas)})`
      )
    }

    setLoading(true)
    try {
      // 1) crear la OP vacía
      let res = await fetch("/api/ordenes-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proveedor_id: Number(proveedorId), fecha_op: fechaOp, moneda }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || "Error al crear la orden de pago")
      const opId = body.id

      // 2) agregar facturas (fn_lop_factura_pagable valida cada una)
      for (const [facturaId, monto] of facturasPayload) {
        res = await fetch(`/api/ordenes-pago/${opId}/facturas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ factura_id: Number(facturaId), monto: Number(monto) }),
        })
        if (!res.ok) throw new Error((await res.json()).error || "Error al agregar una factura")
      }

      // 3) repartir en cajas
      for (const [cajaId, monto] of Object.entries(repartos).filter(([, m]) => Number(m) > 0)) {
        res = await fetch(`/api/ordenes-pago/${opId}/cajas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caja_id: Number(cajaId), monto: Number(monto) }),
        })
        if (!res.ok) throw new Error((await res.json()).error || "Error al agregar una caja")
      }

      showSuccessToast("Orden de pago creada", body.numero_op)
      router.push(`/ordenes-pago/${opId}`)
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido"
      setError(mensaje)
      showErrorToast("No se pudo crear la orden de pago", mensaje)
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
          <CardTitle>Nueva orden de pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={proveedorId} onValueChange={setProveedorId} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={moneda} onValueChange={setMoneda} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ARS", "USD", "EUR"].map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_op">Fecha</Label>
              <Input id="fecha_op" type="date" value={fechaOp} onChange={(e) => setFechaOp(e.target.value)} disabled={loading} />
            </div>
          </div>
        </CardContent>
      </Card>

      {proveedorId && (
        <Card>
          <CardHeader><CardTitle>Facturas a pagar (finalizadas)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {facturas.length === 0 && (
              <p className="text-sm text-muted-foreground">Este proveedor no tiene facturas finalizadas.</p>
            )}
            {facturas.map((f) => (
              <div key={f.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end border-b pb-2">
                <div className="md:col-span-2">
                  <p className="font-mono text-sm">{f.numero_factura}</p>
                  <p className="text-xs text-muted-foreground">Total: {formatCurrency(f.total_facturado)} {f.moneda}</p>
                </div>
                <div className="space-y-1">
                  <Label>Monto a pagar</Label>
                  <Input type="number" min="0" step="0.01" value={pagos[f.id] ?? ""} onChange={(e) => setPagos((p) => ({ ...p, [f.id]: e.target.value }))} disabled={loading} placeholder="0" />
                </div>
              </div>
            ))}
            <div className="flex justify-end text-sm">
              Total facturas: <strong className="ml-2">{formatCurrency(totalFacturas)}</strong>
            </div>
          </CardContent>
        </Card>
      )}

      {proveedorId && (
        <Card>
          <CardHeader><CardTitle>Repartir en cajas ({moneda})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cajasDeLaMoneda.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay cajas en {moneda}. Creá una en el catálogo.</p>
            )}
            {cajasDeLaMoneda.map((c) => (
              <div key={c.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end border-b pb-2">
                <div className="md:col-span-2">
                  <p className="font-medium text-sm">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.tipo}{c.entidad ? ` · ${c.entidad}` : ""}</p>
                </div>
                <div className="space-y-1">
                  <Label>Monto</Label>
                  <Input type="number" min="0" step="0.01" value={repartos[c.id] ?? ""} onChange={(e) => setRepartos((p) => ({ ...p, [c.id]: e.target.value }))} disabled={loading} placeholder="0" />
                </div>
              </div>
            ))}
            <div className="flex justify-end text-sm">
              <span className={!sumasCoinciden && totalCajas > 0 ? "text-red-600" : ""}>
                Total cajas: <strong>{formatCurrency(totalCajas)}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !sumasCoinciden}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear orden de pago
        </Button>
      </div>
    </form>
  )
}
