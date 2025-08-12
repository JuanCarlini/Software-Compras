export interface Reporte {
  id: string
  nombre: string
  tipo: TipoReporte
  descripcion?: string
  parametros: ReporteParametros
  formato: FormatoReporte
  estado: EstadoReporte
  resultado_url?: string
  fecha_generacion?: Date
  generado_por: string
  created_at: Date
  updated_at: Date
}

export enum TipoReporte {
  ORDENES_COMPRA = "Órdenes de Compra",
  ORDENES_PAGO = "Órdenes de Pago", 
  PROVEEDORES = "Proveedores",
  PRODUCTOS = "Productos",
  FINANCIERO = "Financiero",
  INVENTARIO = "Inventario"
}

export enum FormatoReporte {
  PDF = "PDF",
  EXCEL = "Excel",
  CSV = "CSV"
}

export enum EstadoReporte {
  PENDIENTE = "Pendiente",
  GENERANDO = "Generando", 
  COMPLETADO = "Completado",
  ERROR = "Error"
}

export interface ReporteParametros {
  fecha_inicio?: Date
  fecha_fin?: Date
  proveedor_id?: string
  estado_orden?: string
  incluir_totales?: boolean
  [key: string]: any
}

export interface CreateReporteData {
  nombre: string
  tipo: TipoReporte
  descripcion?: string
  parametros: ReporteParametros
  formato: FormatoReporte
}

export interface ReporteEstadisticas {
  total_reportes: number
  reportes_este_mes: number
  reportes_pendientes: number
  formatos_mas_usados: { formato: FormatoReporte; cantidad: number }[]
  tipos_mas_generados: { tipo: TipoReporte; cantidad: number }[]
}
