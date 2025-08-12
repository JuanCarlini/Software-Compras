import { toast } from "sonner"

export const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

export const showErrorToast = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 5000, // Errores duran un poco más
  })
}

export const showWarningToast = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 4500,
  })
}

export const showInfoToast = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 3500,
  })
}

// Toast messages específicos para acciones comunes
export const toastMessages = {
  // Órdenes de Compra
  ordenCompra: {
    created: "Orden de compra creada exitosamente",
    updated: "Orden de compra actualizada",
    deleted: "Orden de compra eliminada",
    approved: "Orden de compra aprobada",
    rejected: "Orden de compra rechazada",
    error: "Error al procesar la orden de compra"
  },
  
  // Órdenes de Pago
  ordenPago: {
    created: "Orden de pago creada exitosamente",
    updated: "Orden de pago actualizada",
    deleted: "Orden de pago eliminada",
    approved: "Orden de pago aprobada",
    paid: "Orden de pago marcada como pagada",
    error: "Error al procesar la orden de pago"
  },
  
  // Proveedores
  proveedor: {
    created: "Proveedor registrado exitosamente",
    updated: "Información del proveedor actualizada",
    deleted: "Proveedor eliminado",
    activated: "Proveedor activado",
    deactivated: "Proveedor desactivado",
    error: "Error al procesar el proveedor"
  },
  
  // Reportes
  reporte: {
    created: "Reporte generado exitosamente",
    regenerated: "Reporte regenerado",
    deleted: "Reporte eliminado",
    downloaded: "Reporte descargado",
    error: "Error al procesar el reporte"
  },
  
  // Configuración
  configuracion: {
    updated: "Configuración actualizada exitosamente",
    exported: "Configuración exportada",
    imported: "Configuración importada exitosamente",
    reset: "Configuración restablecida",
    logoUploaded: "Logo actualizado exitosamente",
    error: "Error al actualizar la configuración"
  },
  
  // General
  general: {
    loading: "Procesando...",
    networkError: "Error de conexión",
    unknownError: "Ha ocurrido un error inesperado"
  }
}
