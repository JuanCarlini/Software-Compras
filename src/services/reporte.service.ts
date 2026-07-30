import { ReporteRepository } from "@/repositories/reporte.repository"
import { FiltrosReporteSchema, type FiltrosReporte } from "@/shared/validation/reporte-validation"
import type { TablaReporte } from "@/lib/export/tipos"
import { COLUMNAS, calcularTotales, describirFiltros } from "@/lib/export/tablas"

export interface ReporteResultado {
  titulo: string
  filtros: FiltrosReporte
  tablas: TablaReporte[]
}

// Template Method: el esqueleto validar -> consultar -> adaptar es identico en los seis
// reportes; las subclases solo aportan consultar, que es el unico paso que varia.
export abstract class ReporteBase<TFila> {
  abstract readonly nombre: string
  abstract readonly titulo: string

  async generar(crudos: unknown): Promise<ReporteResultado> {
    const filtros = this.validar(crudos)
    const filas = await this.consultar(filtros)
    return { titulo: this.titulo, filtros, tablas: this.adaptar(filas, filtros) }
  }

  protected validar(crudos: unknown): FiltrosReporte {
    return FiltrosReporteSchema.parse(crudos)
  }

  protected abstract consultar(f: FiltrosReporte): Promise<TFila[]>

  // Paso sobrescribible con implementacion por defecto: las columnas salen de COLUMNAS
  // por nombre de reporte, asi que ninguna subclase necesita repetir este cuerpo.
  protected adaptar(filas: TFila[], f: FiltrosReporte): TablaReporte[] {
    const columnas = COLUMNAS[this.nombre]
    const filasGenericas = filas as unknown as Array<Record<string, unknown>>
    return [{
      titulo: this.titulo,
      filtros: describirFiltros(f),
      columnas,
      filas: filasGenericas,
      totales: calcularTotales(columnas, filasGenericas),
    }]
  }
}

export class ReporteCircuito extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "circuito"
  readonly titulo = "Circuito de compras"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.circuito<Record<string, unknown>>(f)
  }
}

export class ReporteCircuitoMensual extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "circuito-mensual"
  readonly titulo = "Evolución mensual del circuito"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.circuitoMensual<Record<string, unknown>>(f)
  }
}

export class ReportePendienteCertificar extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "pendiente-certificar"
  readonly titulo = "Pendiente de certificar"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.pendienteCertificar<Record<string, unknown>>(f)
  }
}

export class ReporteDeuda extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "deuda"
  readonly titulo = "Deuda con proveedores"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.deuda<Record<string, unknown>>(f)
  }
}

export class ReporteProveedores extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "proveedores"
  readonly titulo = "Circuito por proveedor"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.proveedores<Record<string, unknown>>(f)
  }
}

export class ReporteProyectos extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "proyectos"
  readonly titulo = "Ejecución por proyecto"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.proyectos<Record<string, unknown>>(f)
  }
}

// Registry: despacha por nombre y es lo que evita seis rutas copiadas.
export const REPORTES: Record<string, ReporteBase<Record<string, unknown>>> = {
  circuito: new ReporteCircuito(),
  "circuito-mensual": new ReporteCircuitoMensual(),
  "pendiente-certificar": new ReportePendienteCertificar(),
  deuda: new ReporteDeuda(),
  proveedores: new ReporteProveedores(),
  proyectos: new ReporteProyectos(),
}
