"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReporte } from "@/hooks/use-reporte"
import { BarraHorizontal, TortaComposicion } from "./graficos"
import { TablaReporte } from "./tabla-reporte"

interface FilaProveedor {
  proveedor: string
  moneda: string
  comprado: number
}

export function TabProveedores() {
  const { resultado, cargando, error } = useReporte("proveedores")

  if (!resultado) {
    return <p className="py-8 text-center text-muted-foreground">{error ?? "Cargando…"}</p>
  }

  const tabla = resultado.tablas[0]
  const filas = tabla.filas as unknown as FilaProveedor[]

  // Con el filtro de moneda en "todas" las filas llegan mezcladas en ARS y USD: el top 10
  // y la torta se arman por moneda, igual que en Deuda y Pendiente de certificar.
  const monedas = [...new Set(filas.map((f) => f.moneda))]

  return (
    // Al refiltrar se conserva el render anterior atenuado: sin salto a esqueleto.
    <div className={`space-y-6 ${cargando ? "opacity-40 transition-opacity" : ""}`}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {monedas.map((moneda) => {
        const filasMoneda = filas.filter((f) => f.moneda === moneda)
        const ordenadas = [...filasMoneda].sort((a, b) => Number(b.comprado) - Number(a.comprado))

        const top10 = ordenadas.slice(0, 10).map((f) => ({
          etiqueta: f.proveedor,
          comprado: Number(f.comprado),
        }))

        // Top cinco más "Otros": seis segmentos como máximo, el límite legible de un vistazo.
        // Con cinco proveedores o menos no queda resto, y "Otros" en cero mentiría sobre los datos.
        const top5 = ordenadas.slice(0, 5).map((f) => ({ nombre: f.proveedor, monto: Number(f.comprado) }))
        const resto = ordenadas.slice(5).reduce((s, f) => s + Number(f.comprado), 0)
        const composicion = resto > 0 ? [...top5, { nombre: "Otros", monto: resto }] : top5

        return (
          <div key={moneda} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Diez mayores por monto comprado ({moneda})</CardTitle></CardHeader>
                <CardContent>
                  <BarraHorizontal datos={top10} clave="comprado" etiqueta="etiqueta" moneda={moneda} alto={380} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Composición del gasto ({moneda})</CardTitle></CardHeader>
                <CardContent><TortaComposicion datos={composicion} moneda={moneda} alto={380} /></CardContent>
              </Card>
            </div>
          </div>
        )
      })}

      {/* Los proveedores suspendidos siguen en esta tabla con su estado: la columna
          "estado" viene del servicio y es gasto ya ejecutado, no se oculta. */}
      <Card>
        <CardHeader><CardTitle>Detalle</CardTitle></CardHeader>
        <CardContent><TablaReporte tabla={tabla} /></CardContent>
      </Card>
    </div>
  )
}
