/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", 
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num)
}

/**
 * Convierte un string a número de manera segura
 */
export function parseNumber(value: string): number {
  const num = parseFloat(value.replace(/[^\d.-]/g, ""))
  return isNaN(num) ? 0 : num
}

/**
 * Calcula el porcentaje
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return (part / total) * 100
}
