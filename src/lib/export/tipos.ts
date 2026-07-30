// Estructura unica que alimenta la tabla en pantalla, el Excel y el PDF. El tipo de
// columna es lo que hace que en Excel los montos sean numeros y las fechas, fechas.
export type TipoColumna = "texto" | "numero" | "moneda" | "fecha" | "porcentaje"

export interface ColumnaReporte {
  clave: string
  titulo: string
  tipo: TipoColumna
}

export interface TablaReporte {
  titulo: string
  filtros: Record<string, string>
  columnas: ColumnaReporte[]
  filas: Array<Record<string, unknown>>
  totales?: Record<string, number>
}

// Strategy: cada formato (CSV, XLSX, ...) implementa esto y se suma al registro.
// Agregar un formato nuevo es una clase mas una linea, sin condicionales por formato.
export interface EstrategiaExport {
  readonly formato: string
  readonly mime: string
  readonly extension: string
  generar(tablas: TablaReporte[]): Promise<Buffer>
}
