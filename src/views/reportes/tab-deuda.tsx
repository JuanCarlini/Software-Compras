"use client"

import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReporte } from "@/hooks/use-reporte"
import { StatTile } from "./graficos"
import { TablaReporte } from "./tabla-reporte"
import { formatearValor } from "./formato"

interface FilaDeuda {
  proveedor: string
  moneda: string
  saldo: number
  dias: number
  tramo: string
}

// Severidad real, no identidad de serie: por eso paleta de estado. La etiqueta del
// tramo está siempre visible en la leyenda; un color de estado nunca comunica solo.
const TRAMOS = [
  { clave: "0-30", color: "var(--rep-estado-bueno)" },
  { clave: "31-60", color: "var(--rep-estado-aviso)" },
  { clave: "61-90", color: "var(--rep-estado-grave)" },
  { clave: "+90", color: "var(--rep-estado-critico)" },
]

export function TabDeuda() {
  const { resultado, cargando, error } = useReporte("deuda")

  if (!resultado) {
    return <p className="py-8 text-center text-muted-foreground">{error ?? "Cargando…"}</p>
  }

  const tabla = resultado.tablas[0]
  const filas = tabla.filas as unknown as FilaDeuda[]

  // Con el filtro de moneda en "todas" las filas llegan mezcladas en ARS y USD: sumar
  // la deuda global mezclaría montos, así que cada bloque se agrupa por moneda.
  const monedas = [...new Set(filas.map((f) => f.moneda))]

  return (
    // Al refiltrar se conserva el render anterior atenuado: sin salto a esqueleto.
    <div className={`space-y-6 ${cargando ? "opacity-40 transition-opacity" : ""}`}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {monedas.map((moneda) => {
        const filasMoneda = filas.filter((f) => f.moneda === moneda)
        const total = filasMoneda.reduce((s, f) => s + Number(f.saldo), 0)
        const diasPromedio = Math.round(
          filasMoneda.reduce((s, f) => s + Number(f.dias), 0) / filasMoneda.length
        )

        // La suma de los cuatro tramos por proveedor tiene que dar el saldo total del
        // indicador: cada fila aporta su saldo entero al tramo que le corresponde.
        const porProveedor = Object.values(
          filasMoneda.reduce<Record<string, Record<string, number | string>>>((acc, f) => {
            acc[f.proveedor] ??= { proveedor: f.proveedor, "0-30": 0, "31-60": 0, "61-90": 0, "+90": 0 }
            acc[f.proveedor][f.tramo] = Number(acc[f.proveedor][f.tramo] ?? 0) + Number(f.saldo)
            return acc
          }, {})
        )

        return (
          <div key={moneda} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatTile titulo={`Deuda total (${moneda})`} valor={formatearValor(total, "moneda", moneda)} />
              <StatTile titulo="Facturas impagas" valor={String(filasMoneda.length)} />
              <StatTile titulo="Antigüedad promedio" valor={`${diasPromedio} días`} />
            </div>

            <Card>
              <CardHeader><CardTitle>Antigüedad de la deuda por proveedor ({moneda})</CardTitle></CardHeader>
              <CardContent>
                <div style={{ height: 420 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porProveedor} layout="vertical" margin={{ left: 24, right: 48 }}>
                      <CartesianGrid horizontal={false} stroke="var(--rep-grid)" />
                      <XAxis
                        type="number"
                        stroke="var(--rep-eje)"
                        tick={{ fill: "var(--rep-tinta-mutada)", fontSize: 12 }}
                        tickFormatter={(v) => formatearValor(v, "moneda", moneda)}
                      />
                      <YAxis
                        type="category"
                        dataKey="proveedor"
                        width={180}
                        stroke="var(--rep-eje)"
                        tick={{ fill: "var(--rep-tinta-mutada)", fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(v) => formatearValor(v, "moneda", moneda)}
                        contentStyle={{ background: "var(--rep-grid)", border: "none", borderRadius: 8 }}
                      />
                      <Legend />
                      {TRAMOS.map((t) => (
                        <Bar
                          key={t.clave}
                          dataKey={t.clave}
                          name={`${t.clave} días`}
                          stackId="aging"
                          fill={t.color}
                          barSize={18}
                          // Separación por hueco de superficie, no un borde: un trazo en color
                          // de grilla sería una línea dibujada alrededor de cada segmento.
                          stroke="var(--rep-superficie)"
                          strokeWidth={2}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
