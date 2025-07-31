// Configuración centralizada de rutas
export const ROUTES = {
  // Auth Routes
  LOGIN: "/login",
  REGISTER: "/register",
  
  // Dashboard Routes  
  DASHBOARD: "/dashboard",
  ORDENES_COMPRA: "/ordenes-compra",
  ORDENES_PAGO: "/ordenes-pago",
  PROVEEDORES: "/proveedores",
  REPORTES: "/reportes",
  CONFIGURACION: "/configuracion",
  
  // API Routes
  API: {
    AUTH: "/api/auth",
    ORDENES_COMPRA: "/api/ordenes-compra", 
    ORDENES_PAGO: "/api/ordenes-pago",
    PROVEEDORES: "/api/proveedores",
    REPORTES: "/api/reportes"
  }
} as const

// Configuración de navegación
export const NAVIGATION_ITEMS = [
  {
    title: "Dashboard",
    url: ROUTES.DASHBOARD,
    icon: "Home"
  },
  {
    title: "Órdenes de Compra", 
    url: ROUTES.ORDENES_COMPRA,
    icon: "ShoppingCart"
  },
  {
    title: "Órdenes de Pago",
    url: ROUTES.ORDENES_PAGO, 
    icon: "CreditCard"
  },
  {
    title: "Proveedores",
    url: ROUTES.PROVEEDORES,
    icon: "Building2"
  },
  {
    title: "Reportes", 
    url: ROUTES.REPORTES,
    icon: "BarChart3"
  },
  {
    title: "Configuración",
    url: ROUTES.CONFIGURACION,
    icon: "Settings"
  }
] as const
