"use client"

import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { formatearValor } from "./formato"

const ORDINAL = [
  "var(--rep-ordinal-1)", "var(--rep-ordinal-2)",
  "var(--rep-ordinal-3)", "var(--rep-ordinal-4)",
]
const SERIES = [
  "var(--rep-serie-1)", "var(--rep-serie-2)", "var(--rep-serie-3)",
  "var(--rep-serie-4)", "var(--rep-serie-5)", "var(--rep-serie-6)",
]

const EJE = {
  stroke: "var(--rep-eje)",
  tick: { fill: "var(--rep-tinta-mutada)", fontSize: 12 },
}

// El alto incluye la banda del eje X: fijar solo el area de trazado deja la tarjeta
// con un scroll vertical diminuto.
function Contenedor({ alto, children }: { alto: number; children: React.ReactElement }) {
  return (
    <div style={{ height: alto }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  )
}

// Una serie, un color. Pintar cada barra segun su valor duplica en color lo que el
// largo ya comunica y quema el unico canal libre.
export function BarraHorizontal({
  datos, clave, etiqueta, moneda, alto = 320,
}: {
  datos: Array<Record<string, unknown>>
  clave: string
  etiqueta: string
  moneda?: string
  alto?: number
}) {
  return (
    <Contenedor alto={alto}>
      <BarChart data={datos} layout="vertical" margin={{ left: 24, right: 48 }}>
        <CartesianGrid horizontal={false} stroke="var(--rep-grid)" />
        <XAxis type="number" {...EJE} tickFormatter={(v) => formatearValor(v, "moneda", moneda)} />
        <YAxis type="category" dataKey={etiqueta} width={180} {...EJE} />
        <Tooltip
          formatter={(v) => formatearValor(v, "moneda", moneda)}
          contentStyle={{ background: "var(--rep-grid)", border: "none", borderRadius: 8 }}
        />
        <Bar dataKey={clave} fill="var(--rep-serie-1)" radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </Contenedor>
  )
}

// Etapas ordenadas de una progresion, no identidades: rampa de un solo tono.
export function Embudo({
  etapas, moneda, alto = 280,
}: {
  etapas: Array<{ etapa: string; monto: number; porcentaje: number }>
  moneda: string
  alto?: number
}) {
  return (
    <Contenedor alto={alto}>
      <BarChart data={etapas} layout="vertical" margin={{ left: 24, right: 96 }}>
        <CartesianGrid horizontal={false} stroke="var(--rep-grid)" />
        <XAxis type="number" {...EJE} tickFormatter={(v) => formatearValor(v, "moneda", moneda)} />
        <YAxis type="category" dataKey="etapa" width={110} {...EJE} />
        <Tooltip
          formatter={(v) => formatearValor(v, "moneda", moneda)}
          contentStyle={{ background: "var(--rep-grid)", border: "none", borderRadius: 8 }}
        />
        <Bar dataKey="monto" radius={[0, 4, 4, 0]} barSize={26}>
          {etapas.map((_, i) => <Cell key={i} fill={ORDINAL[i] ?? ORDINAL[3]} />)}
        </Bar>
      </BarChart>
    </Contenedor>
  )
}

// Solo monto. La cantidad de documentos va en la tabla: dos ejes Y inventan una
// correlacion que no esta en los datos.
export function LineaTemporal({
  datos, series, moneda, alto = 300,
}: {
  datos: Array<Record<string, unknown>>
  series: Array<{ clave: string; nombre: string }>
  moneda: string
  alto?: number
}) {
  return (
    <Contenedor alto={alto}>
      <LineChart data={datos} margin={{ left: 24, right: 24 }}>
        <CartesianGrid vertical={false} stroke="var(--rep-grid)" />
        <XAxis dataKey="mes" {...EJE} />
        <YAxis {...EJE} tickFormatter={(v) => formatearValor(v, "moneda", moneda)} />
        <Tooltip
          formatter={(v) => formatearValor(v, "moneda", moneda)}
          contentStyle={{ background: "var(--rep-grid)", border: "none", borderRadius: 8 }}
        />
        <Legend />
        {series.map((s, i) => (
          <Line
            key={s.clave}
            type="monotone"
            dataKey={s.clave}
            name={s.nombre}
            stroke={SERIES[i]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </Contenedor>
  )
}

// Parte de un todo, de un vistazo, seis segmentos como maximo. Fuera de ese caso
// una barra comunica mejor.
export function TortaComposicion({
  datos, moneda, alto = 320,
}: {
  datos: Array<{ nombre: string; monto: number }>
  moneda: string
  alto?: number
}) {
  return (
    <Contenedor alto={alto}>
      <PieChart>
        <Pie data={datos} dataKey="monto" nameKey="nombre" innerRadius={0} outerRadius={110}>
          {datos.map((_, i) => (
            <Cell key={i} fill={SERIES[i % SERIES.length]} stroke="var(--rep-grid)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => formatearValor(v, "moneda", moneda)}
          contentStyle={{ background: "var(--rep-grid)", border: "none", borderRadius: 8 }}
        />
        <Legend />
      </PieChart>
    </Contenedor>
  )
}

// Un ratio contra un limite: la forma correcta es un medidor, no un grafico.
export function Medidor({ valor, total }: { valor: number; total: number }) {
  const pct = total > 0 ? Math.min((valor / total) * 100, 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--rep-serie-1)" }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {total > 0 ? `${pct.toFixed(0)}%` : "—"}
      </span>
    </div>
  )
}

// Cifras protagonistas: figuras proporcionales, no tabular-nums, que a tamano grande
// dejan los numeros sueltos.
export function StatTile({
  titulo, valor, detalle,
}: {
  titulo: string
  valor: string
  detalle?: string
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>}
    </div>
  )
}
