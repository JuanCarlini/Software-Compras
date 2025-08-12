import { 
  Reporte, 
  CreateReporteData,
  TipoReporte,
  FormatoReporte,
  EstadoReporte,
  ReporteEstadisticas
} from "@/models"

// Datos mock de reportes
const reportes: Reporte[] = [
  {
    id: "1",
    nombre: "Reporte de Órdenes de Compra - Enero 2025",
    tipo: TipoReporte.ORDENES_COMPRA,
    descripcion: "Reporte mensual de todas las órdenes de compra del mes de enero",
    parametros: {
      fecha_inicio: new Date("2025-01-01"),
      fecha_fin: new Date("2025-01-31"),
      incluir_totales: true
    },
    formato: FormatoReporte.PDF,
    estado: EstadoReporte.COMPLETADO,
    resultado_url: "/reportes/downloads/ordenes-compra-enero-2025.pdf",
    fecha_generacion: new Date("2025-01-31T10:30:00"),
    generado_por: "admin@empresa.com",
    created_at: new Date("2025-01-31T10:28:00"),
    updated_at: new Date("2025-01-31T10:30:00")
  },
  {
    id: "2",
    nombre: "Análisis de Proveedores - Q1 2025",
    tipo: TipoReporte.PROVEEDORES,
    descripcion: "Análisis de rendimiento y estadísticas de proveedores del primer trimestre",
    parametros: {
      fecha_inicio: new Date("2025-01-01"),
      fecha_fin: new Date("2025-03-31"),
      incluir_totales: true
    },
    formato: FormatoReporte.EXCEL,
    estado: EstadoReporte.COMPLETADO,
    resultado_url: "/reportes/downloads/proveedores-q1-2025.xlsx",
    fecha_generacion: new Date("2025-02-01T14:15:00"),
    generado_por: "admin@empresa.com",
    created_at: new Date("2025-02-01T14:10:00"),
    updated_at: new Date("2025-02-01T14:15:00")
  },
  {
    id: "3",
    nombre: "Reporte Financiero - Febrero 2025",
    tipo: TipoReporte.FINANCIERO,
    descripcion: "Resumen financiero del mes de febrero",
    parametros: {
      fecha_inicio: new Date("2025-02-01"),
      fecha_fin: new Date("2025-02-28"),
      incluir_totales: true
    },
    formato: FormatoReporte.PDF,
    estado: EstadoReporte.GENERANDO,
    generado_por: "admin@empresa.com",
    created_at: new Date("2025-02-28T16:45:00"),
    updated_at: new Date("2025-02-28T16:45:00")
  }
]

const estadisticasMock: ReporteEstadisticas = {
  total_reportes: 25,
  reportes_este_mes: 8,
  reportes_pendientes: 2,
  formatos_mas_usados: [
    { formato: FormatoReporte.PDF, cantidad: 15 },
    { formato: FormatoReporte.EXCEL, cantidad: 8 },
    { formato: FormatoReporte.CSV, cantidad: 2 }
  ],
  tipos_mas_generados: [
    { tipo: TipoReporte.ORDENES_COMPRA, cantidad: 8 },
    { tipo: TipoReporte.PROVEEDORES, cantidad: 6 },
    { tipo: TipoReporte.FINANCIERO, cantidad: 5 },
    { tipo: TipoReporte.ORDENES_PAGO, cantidad: 4 },
    { tipo: TipoReporte.PRODUCTOS, cantidad: 2 }
  ]
}

export class ReporteController {
  static async getAll(): Promise<Reporte[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return [...reportes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  static async getById(id: string): Promise<Reporte | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return reportes.find(reporte => reporte.id === id) || null
  }

  static async getEstadisticas(): Promise<ReporteEstadisticas> {
    await new Promise(resolve => setTimeout(resolve, 400))
    return estadisticasMock
  }

  static async create(data: CreateReporteData): Promise<Reporte> {
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simular generación

    const newId = (reportes.length + 1).toString()
    const newReporte: Reporte = {
      id: newId,
      ...data,
      estado: EstadoReporte.COMPLETADO, // En la vida real sería PENDIENTE/GENERANDO
      resultado_url: `/reportes/downloads/${data.nombre.toLowerCase().replace(/\s+/g, '-')}.${data.formato.toLowerCase()}`,
      fecha_generacion: new Date(),
      generado_por: "admin@empresa.com", // En la vida real vendría del usuario autenticado
      created_at: new Date(),
      updated_at: new Date()
    }

    reportes.push(newReporte)
    return newReporte
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = reportes.findIndex(reporte => reporte.id === id)
    if (index === -1) return false
    
    reportes.splice(index, 1)
    return true
  }

  static async regenerar(id: string): Promise<Reporte | null> {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    const reporte = reportes.find(r => r.id === id)
    if (!reporte) return null

    // Simular regeneración
    reporte.estado = EstadoReporte.COMPLETADO
    reporte.fecha_generacion = new Date()
    reporte.updated_at = new Date()
    reporte.resultado_url = `/reportes/downloads/${reporte.nombre.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${reporte.formato.toLowerCase()}`

    return reporte
  }

  static async descargar(id: string, formato: 'pdf' | 'excel'): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const reporte = reportes.find(r => r.id === id)
    if (!reporte) throw new Error("Reporte no encontrado")

    // Simular descarga - en la vida real sería una URL real
    return `/reportes/downloads/${reporte.nombre.toLowerCase().replace(/\s+/g, '-')}.${formato}`
  }

  // Métodos para obtener datos específicos para reportes
  static async getReporteData(tipo: TipoReporte, parametros: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    switch (tipo) {
      case TipoReporte.ORDENES_COMPRA:
        return {
          total_ordenes: 45,
          monto_total: 125000,
          promedio_orden: 2777.78,
          ordenes_por_estado: {
            pendiente: 12,
            aprobada: 25,
            recibida: 8
          }
        }
      
      case TipoReporte.PROVEEDORES:
        return {
          total_proveedores: 15,
          proveedores_activos: 12,
          proveedores_suspendidos: 3,
          top_proveedores: [
            { nombre: "ABC Corporation", total_ordenes: 15, monto_total: 45000 },
            { nombre: "XYZ Supplies Ltd", total_ordenes: 12, monto_total: 38000 }
          ]
        }
      
      case TipoReporte.FINANCIERO:
        return {
          ingresos_totales: 250000,
          gastos_totales: 125000,
          utilidad_neta: 125000,
          margen_utilidad: 50.0,
          cuentas_por_pagar: 35000,
          cuentas_por_cobrar: 85000
        }
      
      default:
        return {}
    }
  }
}
