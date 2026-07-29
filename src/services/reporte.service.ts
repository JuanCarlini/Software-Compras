import { ReporteRepository } from "@/repositories/reporte.repository"
import { FiltrosReporteSchema, type FiltrosReporte } from "@/shared/validation/reporte-validation"
import type { TablaReporte } from "@/lib/export/tipos"

export interface ReporteResultado {
  titulo: string
  filtros: FiltrosReporte
  tablas: TablaReporte[]
}

// Template Method: el esqueleto validar -> consultar -> adaptar es identico en los cinco
// reportes; las subclases solo aportan los dos pasos que varian.
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
  protected abstract adaptar(filas: TFila[], f: FiltrosReporte): TablaReporte[]
}

export class ReporteCircuito extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "circuito"
  readonly titulo = "Circuito de compras"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.circuito<Record<string, unknown>>(f)
  }

  protected adaptar(filas: Record<string, unknown>[], f: FiltrosReporte): TablaReporte[] {
    return [{
      titulo: this.titulo,
      filtros: describirFiltros(f),
      columnas: [
        { clave: "moneda", titulo: "Moneda", tipo: "texto" },
        { clave: "comprado", titulo: "Comprado", tipo: "moneda" },
        { clave: "certificado", titulo: "Certificado", tipo: "moneda" },
        { clave: "facturado", titulo: "Facturado", tipo: "moneda" },
        { clave: "pagado", titulo: "Pagado", tipo: "moneda" },
      ],
      filas,
    }]
  }
}

export class ReportePendienteCertificar extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "pendiente-certificar"
  readonly titulo = "Pendiente de certificar"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.pendienteCertificar<Record<string, unknown>>(f)
  }

  protected adaptar(filas: Record<string, unknown>[], f: FiltrosReporte): TablaReporte[] {
    return [{
      titulo: this.titulo,
      filtros: describirFiltros(f),
      columnas: [
        { clave: "numero_oc", titulo: "OC", tipo: "texto" },
        { clave: "proveedor", titulo: "Proveedor", tipo: "texto" },
        { clave: "proyecto", titulo: "Proyecto", tipo: "texto" },
        { clave: "fecha_oc", titulo: "Fecha", tipo: "fecha" },
        { clave: "moneda", titulo: "Moneda", tipo: "texto" },
        { clave: "total_oc", titulo: "Total OC", tipo: "moneda" },
        { clave: "pendiente", titulo: "Pendiente", tipo: "moneda" },
        { clave: "dias", titulo: "Días", tipo: "numero" },
      ],
      filas,
    }]
  }
}

export class ReporteDeuda extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "deuda"
  readonly titulo = "Deuda con proveedores"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.deuda<Record<string, unknown>>(f)
  }

  protected adaptar(filas: Record<string, unknown>[], f: FiltrosReporte): TablaReporte[] {
    return [{
      titulo: this.titulo,
      filtros: describirFiltros(f),
      columnas: [
        { clave: "numero_factura", titulo: "Factura", tipo: "texto" },
        { clave: "proveedor", titulo: "Proveedor", tipo: "texto" },
        { clave: "fecha_emision", titulo: "Emisión", tipo: "fecha" },
        { clave: "moneda", titulo: "Moneda", tipo: "texto" },
        { clave: "total_facturado", titulo: "Total", tipo: "moneda" },
        { clave: "pagado", titulo: "Pagado", tipo: "moneda" },
        { clave: "saldo", titulo: "Saldo", tipo: "moneda" },
        { clave: "dias", titulo: "Días", tipo: "numero" },
        { clave: "tramo", titulo: "Tramo", tipo: "texto" },
      ],
      filas,
    }]
  }
}

export class ReporteProveedores extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "proveedores"
  readonly titulo = "Circuito por proveedor"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.proveedores<Record<string, unknown>>(f)
  }

  protected adaptar(filas: Record<string, unknown>[], f: FiltrosReporte): TablaReporte[] {
    return [{
      titulo: this.titulo,
      filtros: describirFiltros(f),
      columnas: [
        { clave: "proveedor", titulo: "Proveedor", tipo: "texto" },
        { clave: "estado", titulo: "Estado", tipo: "texto" },
        { clave: "moneda", titulo: "Moneda", tipo: "texto" },
        { clave: "comprado", titulo: "Comprado", tipo: "moneda" },
        { clave: "certificado", titulo: "Certificado", tipo: "moneda" },
        { clave: "facturado", titulo: "Facturado", tipo: "moneda" },
        { clave: "pagado", titulo: "Pagado", tipo: "moneda" },
        { clave: "deuda", titulo: "Deuda", tipo: "moneda" },
        { clave: "cantidad_oc", titulo: "OC", tipo: "numero" },
      ],
      filas,
    }]
  }
}

export class ReporteProyectos extends ReporteBase<Record<string, unknown>> {
  readonly nombre = "proyectos"
  readonly titulo = "Ejecución por proyecto"

  protected consultar(f: FiltrosReporte) {
    return ReporteRepository.proyectos<Record<string, unknown>>(f)
  }

  protected adaptar(filas: Record<string, unknown>[], f: FiltrosReporte): TablaReporte[] {
    return [{
      titulo: this.titulo,
      filtros: describirFiltros(f),
      columnas: [
        { clave: "proyecto", titulo: "Proyecto", tipo: "texto" },
        { clave: "tarea", titulo: "Tarea", tipo: "texto" },
        { clave: "moneda", titulo: "Moneda", tipo: "texto" },
        { clave: "comprado", titulo: "Comprado", tipo: "moneda" },
        { clave: "certificado", titulo: "Certificado", tipo: "moneda" },
        { clave: "pendiente", titulo: "Pendiente", tipo: "moneda" },
      ],
      filas,
    }]
  }
}

function describirFiltros(f: FiltrosReporte): Record<string, string> {
  return {
    Período: `${f.desde} a ${f.hasta}`,
    Moneda: f.moneda ?? "Todas",
    Proveedor: f.proveedorId ? String(f.proveedorId) : "Todos",
    Proyecto: f.proyectoId ? String(f.proyectoId) : "Todos",
  }
}

// Registry: despacha por nombre y es lo que evita cinco rutas copiadas.
export const REPORTES: Record<string, ReporteBase<Record<string, unknown>>> = {
  circuito: new ReporteCircuito(),
  "pendiente-certificar": new ReportePendienteCertificar(),
  deuda: new ReporteDeuda(),
  proveedores: new ReporteProveedores(),
  proyectos: new ReporteProyectos(),
}
