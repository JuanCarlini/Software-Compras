"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReporte } from "@/hooks/use-reporte"
import { BarraHorizontal, StatTile } from "./graficos"
import { TablaReporte } from "./tabla-reporte"
import { formatearValor } from "./formato"

interface FilaPendiente {
  numero_oc: string
  proveedor: string
  moneda: string
  pendiente: number
  dias: number
}

export function TabPendiente() {
  const { resultado, cargando, error } = useReporte("pendiente-certificar")

  if (!resultado) {
    return <p className="py-8 text-center text-muted-foreground">{error ?? "Cargando…"}</p>
  }

  const tabla = resultado.tablas[0]
  const filas = tabla.filas as unknown as FilaPendiente[]

  // Con el filtro de moneda en "todas" las filas llegan mezcladas en ARS y USD: sumar
  // el pendiente global mezclaría montos, así que cada bloque se agrupa por moneda.
  const monedas = [...new Set(filas.map((f) => f.moneda))]

  return (
    // Al refiltrar se conserva el render anterior atenuado: sin salto a esqueleto.
    <div className={`space-y-6 ${cargando ? "opacity-40 transition-opacity" : ""}`}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {monedas.map((moneda) => {
        const filasMoneda = filas.filter((f) => f.moneda === moneda)
        const total = filasMoneda.reduce((s, f) => s + Number(f.pendiente), 0)
        const top = [...filasMoneda]
          .sort((a, b) => Number(b.pendiente) - Number(a.pendiente))
          .slice(0, 10)
          .map((f) => ({ etiqueta: `${f.numero_oc} · ${f.proveedor}`, pendiente: Number(f.pendiente) }))

        return (
          <div key={moneda} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatTile
                titulo={`Pendiente de certificar (${moneda})`}
                valor={formatearValor(total, "moneda", moneda)}
                detalle="Comprado que todavía no se recibió"
              />
              <StatTile titulo="Órdenes con saldo" valor={String(filasMoneda.length)} />
              <StatTile
                titulo="Antigüedad máxima"
                valor={`${Math.max(...filasMoneda.map((f) => Number(f.dias)))} días`}
              />
            </div>

            <Card>
              <CardHeader><CardTitle>Diez órdenes de mayor saldo ({moneda})</CardTitle></CardHeader>
              <CardContent>
                <BarraHorizontal datos={top} clave="pendiente" etiqueta="etiqueta" moneda={moneda} alto={380} />
              </CardContent>
            </Card>
          </div>
        )
      })}

      <Card>
        <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
        <CardContent><TablaReporte tabla={tabla} /></CardContent>
      </Card>
    </div>
  )
}
