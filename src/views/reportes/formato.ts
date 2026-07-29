import type { TipoColumna } from "@/lib/export/tipos"
import { formatCurrency } from "@/shared/format-utils"

// La moneda es por fila, no global: un reporte puede traer filas en ARS y en USD
// y formatearlas todas igual seria mentir sobre el monto real.
export function formatearValor(valor: unknown, tipo: TipoColumna, moneda = "ARS"): string {
  if (valor === null || valor === undefined || valor === "") return "—"

  switch (tipo) {
    case "moneda":
      // Reusa el formateador compartido del proyecto en vez de duplicar el Intl.NumberFormat.
      return formatCurrency(Number(valor), moneda)
    case "numero":
      return new Intl.NumberFormat("es-AR").format(Number(valor))
    case "porcentaje":
      return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(Number(valor))}%`
    case "fecha":
      return new Date(String(valor)).toLocaleDateString("es-AR")
    default:
      return String(valor)
  }
}
