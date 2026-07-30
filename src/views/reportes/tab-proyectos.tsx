"use client"

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReporte } from "@/hooks/use-reporte"
import { BarraHorizontal, Medidor } from "./graficos"
import { formatearValor } from "./formato"

interface FilaProyecto {
  proyecto: string
  tarea: string
  moneda: string
  comprado: number
  certificado: number
  pendiente: number
}

export function TabProyectos() {
  const { reporte, loading, error } = useReporte("proyectos")

  if (!reporte) {
    return <p className="py-8 text-center text-muted-foreground">{error ?? "Cargando…"}</p>
  }

  const filas = reporte.tablas[0].filas as unknown as FilaProyecto[]

  // Con el filtro de moneda en "todas" las filas llegan mezcladas en ARS y USD: la
  // barra por proyecto se arma por moneda, igual que en las otras pestañas.
  const monedas = [...new Set(filas.map((f) => f.moneda))]

  return (
    // Al refiltrar se conserva el render anterior atenuado: sin salto a esqueleto.
    <div className={`space-y-6 ${loading ? "opacity-40 transition-opacity" : ""}`}>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {monedas.map((moneda) => {
        const filasMoneda = filas.filter((f) => f.moneda === moneda)

        const porProyecto = Object.values(
          filasMoneda.reduce<Record<string, { etiqueta: string; comprado: number }>>((acc, f) => {
            acc[f.proyecto] ??= { etiqueta: f.proyecto, comprado: 0 }
            acc[f.proyecto].comprado += Number(f.comprado)
            return acc
          }, {})
        ).sort((a, b) => b.comprado - a.comprado)

        return (
          <Card key={moneda}>
            <CardHeader><CardTitle>Comprado por proyecto ({moneda})</CardTitle></CardHeader>
            <CardContent>
              <BarraHorizontal
                datos={porProyecto}
                clave="comprado"
                etiqueta="etiqueta"
                moneda={moneda}
                alto={360}
              />
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader><CardTitle>Ejecución por proyecto y tarea</CardTitle></CardHeader>
        <CardContent>
          {filas.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Sin datos para los filtros elegidos. Probá ampliar el período o aflojar los filtros.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead className="text-right">Comprado</TableHead>
                    <TableHead className="text-right">Certificado</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead>Ejecución</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((f, i) => (
                    <TableRow key={i}>
                      <TableCell>{f.proyecto}</TableCell>
                      <TableCell>{f.tarea}</TableCell>
                      <TableCell>{f.moneda}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatearValor(f.comprado, "moneda", f.moneda)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatearValor(f.certificado, "moneda", f.moneda)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatearValor(f.pendiente, "moneda", f.moneda)}
                      </TableCell>
                      <TableCell>
                        <Medidor valor={Number(f.certificado)} total={Number(f.comprado)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
