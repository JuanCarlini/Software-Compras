// Configuración de la aplicación
export const APP_CONFIG = {
  name: "Gestión Uno",
  description: "Sistema integral de gestión empresarial",
  version: "1.0.0"
} as const

// Estados del sistema
export const ESTADOS = {
  ORDEN_COMPRA: {
    PENDIENTE: "Pendiente",
    EN_REVISION: "En Revisión",
    APROBADA: "Aprobada", 
    RECHAZADA: "Rechazada",
    ENVIADA: "Enviada",
    RECIBIDA: "Recibida",
    CANCELADA: "Cancelada"
  },
  PROVEEDOR: {
    ACTIVO: "Activo",
    INACTIVO: "Inactivo",
    SUSPENDIDO: "Suspendido"
  },
  USER: {
    ACTIVO: "activo",
    INACTIVO: "inactivo", 
    SUSPENDIDO: "suspendido"
  }
} as const

// Roles de usuario
export const ROLES = {
  ADMIN: "admin",
  USUARIO: "usuario",
  SUPERVISOR: "supervisor",
  READONLY: "readonly"
} as const

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100
} as const

// URLs de la API
export const API_ROUTES = {
  AUTH: "/api/auth",
  ORDENES_COMPRA: "/api/ordenes-compra",
  ORDENES_PAGO: "/api/ordenes-pago", 
  PROVEEDORES: "/api/proveedores",
  REPORTES: "/api/reportes"
} as const

// URLs de la aplicación
export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  ORDENES_COMPRA: "/ordenes-compra",
  ORDENES_PAGO: "/ordenes-pago",
  PROVEEDORES: "/proveedores", 
  REPORTES: "/reportes",
  CONFIGURACION: "/configuracion"
} as const
