import ExcelJS from "exceljs"
import type { ColumnaReporte, EstrategiaExport, TablaReporte } from "./tipos"
import { neutralizarFormula } from "./csv"

// Motivo de xlsx sobre csv: con todo como texto no se puede ordenar ni pivotear.
// Sin símbolo: la columna puede mezclar ARS y USD; "Moneda" ya distingue cada fila.
function formatoNumerico(tipo: ColumnaReporte["tipo"]): string | undefined {
  switch (tipo) {
    case "moneda": return "#,##0.00"
    case "numero": return "#,##0"
    case "porcentaje": return '0.0"%"'
    case "fecha": return "dd/mm/yyyy"
    default: return undefined
  }
}

// ExcelJS guarda el texto con tipo "s" (string), no como fórmula ("f"): Excel
// no lo ejecuta al abrir. Igual neutralizamos, por si otra planilla difiere.
function convertir(valor: unknown, tipo: ColumnaReporte["tipo"]): unknown {
  if (valor === null || valor === undefined) return null
  if (tipo === "moneda" || tipo === "numero" || tipo === "porcentaje") return Number(valor)
  if (tipo === "fecha") return new Date(String(valor))
  return neutralizarFormula(String(valor))
}

// Excel no admite : \ / ? * [ ] en el nombre de hoja, ni más de 31 caracteres,
// ni dos hojas iguales: si dos títulos truncan igual, se agrega un sufijo numérico.
function nombreHoja(titulo: string, indice: number, usados: Set<string>): string {
  const limpio = titulo.replace(/[:\\/?*[\]]/g, " ").slice(0, 31).trim() || `Hoja ${indice + 1}`
  let candidato = limpio
  let sufijo = 2
  while (usados.has(candidato)) {
    const marca = ` (${sufijo})`
    candidato = limpio.slice(0, 31 - marca.length) + marca
    sufijo++
  }
  usados.add(candidato)
  return candidato
}

export class ExportXlsx implements EstrategiaExport {
  readonly formato = "xlsx"
  readonly mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  readonly extension = "xlsx"

  async generar(tablas: TablaReporte[]): Promise<Buffer> {
    const libro = new ExcelJS.Workbook()
    libro.created = new Date()
    const nombresUsados = new Set<string>()

    tablas.forEach((tabla, indice) => {
      const hoja = libro.addWorksheet(nombreHoja(tabla.titulo, indice, nombresUsados))

      hoja.addRow([tabla.titulo]).font = { bold: true, size: 14 }
      for (const [clave, valor] of Object.entries(tabla.filtros)) {
        hoja.addRow([clave, valor])
      }
      hoja.addRow([])

      const encabezado = hoja.addRow(tabla.columnas.map((c) => c.titulo))
      encabezado.font = { bold: true }
      encabezado.eachCell((celda) => {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE1E0D9" } }
      })

      for (const fila of tabla.filas) {
        hoja.addRow(tabla.columnas.map((c) => convertir(fila[c.clave], c.tipo)))
      }

      // calcularTotales devuelve {} cuando la tabla mezcla monedas (sumar pesos con
      // dólares no tiene sentido), así que sin claves no se escribe fila de totales.
      const clavesTotales = tabla.totales ? Object.keys(tabla.totales) : []
      if (clavesTotales.length > 0) {
        const totales = hoja.addRow(
          tabla.columnas.map((c, i) => (i === 0 ? "Total" : tabla.totales?.[c.clave] ?? null))
        )
        totales.font = { bold: true }
      }

      tabla.columnas.forEach((c, i) => {
        const columna = hoja.getColumn(i + 1)
        columna.width = Math.max(c.titulo.length + 4, 14)
        const formato = formatoNumerico(c.tipo)
        if (formato) columna.numFmt = formato
      })

      // La fila del encabezado queda fija al desplazarse.
      hoja.views = [{ state: "frozen", ySplit: encabezado.number }]
    })

    const datos = await libro.xlsx.writeBuffer()
    return Buffer.from(datos)
  }
}
