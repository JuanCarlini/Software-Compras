/**
 * Formatea una fecha en formato local
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long", 
    day: "numeric"
  }
  
  return new Intl.DateTimeFormat("es-AR", { ...defaultOptions, ...options }).format(dateObj)
}

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 */
export function formatDateShort(date: Date | string): string {
  return formatDate(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * Obtiene el tiempo relativo (hace X días, etc.)
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return "Hoy"
  if (diffInDays === 1) return "Ayer"
  if (diffInDays < 7) return `Hace ${diffInDays} días`
  if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`
  if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`
  
  return `Hace ${Math.floor(diffInDays / 365)} años`
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const today = new Date()
  
  return dateObj.toDateString() === today.toDateString()
}
