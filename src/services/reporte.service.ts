import { ReporteRepository } from "@/repositories/reporte.repository"
import { FiltrosReporteSchema, type FiltrosReporte } from "@/shared/validation/reporte-validation"
import type { TablaReporte } from "@/lib/export/tipos"
import { COLUMNAS, calcularTotales, describirFiltros } from "@/lib/export/tablas"

interface ReporteResultado {
  titulo: string
  filtros: FiltrosReporte
  tablas: TablaReporte[]
}

type Fila = Record<string, unknown>

// El esqueleto validar -> consultar -> adaptar es idéntico en los seis reportes; lo único
// que varía es el título y qué RPC se consulta. Un mapa alcanza: no hace falta una clase
// por reporte. Las columnas salen de COLUMNAS por nombre.
function reporte(nombre: string, titulo: string, consultar: (f: FiltrosReporte) => Promise<Fila[]>) {
  return {
    async generar(crudos: unknown): Promise<ReporteResultado> {
      const filtros = FiltrosReporteSchema.parse(crudos)
      const filas = await consultar(filtros)
      const columnas = COLUMNAS[nombre]
      return {
        titulo,
        filtros,
        tablas: [
          {
            titulo,
            filtros: describirFiltros(filtros),
            columnas,
            filas,
            totales: calcularTotales(columnas, filas),
          },
        ],
      }
    },
  }
}

// Registry: despacha por nombre y es lo que evita seis rutas copiadas.
export const REPORTES: Record<string, ReturnType<typeof reporte>> = {
  circuito: reporte("circuito", "Circuito de compras", (f) => ReporteRepository.circuito<Fila>(f)),
  "circuito-mensual": reporte("circuito-mensual", "Evolución mensual del circuito", (f) =>
    ReporteRepository.circuitoMensual<Fila>(f)
  ),
  "pendiente-certificar": reporte("pendiente-certificar", "Pendiente de certificar", (f) =>
    ReporteRepository.pendienteCertificar<Fila>(f)
  ),
  deuda: reporte("deuda", "Deuda con proveedores", (f) => ReporteRepository.deuda<Fila>(f)),
  proveedores: reporte("proveedores", "Circuito por proveedor", (f) => ReporteRepository.proveedores<Fila>(f)),
  proyectos: reporte("proyectos", "Ejecución por proyecto", (f) => ReporteRepository.proyectos<Fila>(f)),
}
