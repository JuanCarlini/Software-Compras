// Sistema unificado de semaforización para estados
// Todos los estados de la aplicación usan este sistema de colores

import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Activity
} from "lucide-react"

/**
 * Categorías de estado según semáforo
 */
export enum StatusCategory {
  SUCCESS = "success",    // Verde - Aprobado/Completado
  PENDING = "pending",    // Amarillo - Pendiente/En proceso
  ERROR = "error",        // Rojo - Rechazado/Error/Anulado
  INFO = "info"          // Azul - Informativo
}

/**
 * Mapeo de todos los estados posibles a su categoría
 */
const statusMap: Record<string, StatusCategory> = {
  // Estados aprobados/exitosos - VERDE
  "aprobado": StatusCategory.SUCCESS,
  "completado": StatusCategory.SUCCESS,
  "activo": StatusCategory.SUCCESS,
  "pagado": StatusCategory.SUCCESS,
  "finalizado": StatusCategory.SUCCESS,
  
  // Estados pendientes/en proceso - AMARILLO
  "borrador": StatusCategory.PENDING,
  "pendiente": StatusCategory.PENDING,
  "en_aprobacion": StatusCategory.PENDING,
  "en_ejecucion": StatusCategory.PENDING,
  "generando": StatusCategory.PENDING,
  
  // Estados rechazados/error - ROJO
  "rechazado": StatusCategory.ERROR,
  "anulado": StatusCategory.ERROR,
  "error": StatusCategory.ERROR,
  "inactivo": StatusCategory.ERROR,
  "cancelado": StatusCategory.ERROR,
  
  // Estados informativos - AZUL
  "planificado": StatusCategory.INFO,
}

/**
 * Obtiene la categoría de un estado
 */
export function getStatusCategory(estado: string | null | undefined): StatusCategory {
  if (!estado) return StatusCategory.INFO
  const estadoLower = estado.toLowerCase()
  return statusMap[estadoLower] || StatusCategory.INFO
}

/**
 * Obtiene las clases de Tailwind para el color de fondo y texto del badge
 */
export function getStatusColor(estado: string | null | undefined): string {
  const category = getStatusCategory(estado)
  
  switch (category) {
    case StatusCategory.SUCCESS:
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    case StatusCategory.PENDING:
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    case StatusCategory.ERROR:
      return "bg-destructive/10 text-destructive border-destructive/20"
    case StatusCategory.INFO:
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

/**
 * Obtiene el icono correspondiente según la categoría de estado
 */
export function getStatusIcon(estado: string | null | undefined) {
  const category = getStatusCategory(estado)
  
  switch (category) {
    case StatusCategory.SUCCESS:
      return CheckCircle
    case StatusCategory.PENDING:
      return Clock
    case StatusCategory.ERROR:
      return XCircle
    case StatusCategory.INFO:
      return Activity
    default:
      return FileText
  }
}

/**
 * Obtiene las clases de color para el icono
 */
export function getStatusIconColor(estado: string | null | undefined): string {
  const category = getStatusCategory(estado)
  
  switch (category) {
    case StatusCategory.SUCCESS:
      return "text-emerald-600 dark:text-emerald-400"
    case StatusCategory.PENDING:
      return "text-amber-600 dark:text-amber-400"
    case StatusCategory.ERROR:
      return "text-destructive"
    case StatusCategory.INFO:
      return "text-blue-600 dark:text-blue-400"
    default:
      return "text-muted-foreground"
  }
}

/**
 * Obtiene un objeto con toda la información de estilo para un estado
 */
export function getStatusStyle(estado: string | null | undefined) {
  return {
    category: getStatusCategory(estado),
    color: getStatusColor(estado),
    icon: getStatusIcon(estado),
    iconColor: getStatusIconColor(estado),
  }
}
