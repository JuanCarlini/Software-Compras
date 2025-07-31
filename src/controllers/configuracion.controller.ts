import { 
  Empresa, 
  UpdateEmpresaData,
  ConfiguracionEmpresa 
} from "@/models"

// Datos mock de la empresa
const empresaData: Empresa = {
  id: "1",
  razon_social: "Empresa Demo S.A.",
  nombre_comercial: "Demo Corp",
  rut: "12345678-9",
  direccion: "Av. Corrientes 1234",
  ciudad: "Buenos Aires",
  pais: "Argentina",
  telefono: "+54 11 1234-5678",
  email: "contacto@empresa.com",
  sitio_web: "https://empresa.com",
  logo_url: "/logo-empresa.png",
  configuracion: {
    moneda_default: "ARS",
    idioma: "es-AR",
    zona_horaria: "America/Argentina/Buenos_Aires",
    formato_fecha: "DD/MM/YYYY",
    iva_default: 21,
    prefijo_orden_compra: "OC-",
    prefijo_orden_pago: "OP-",
    dias_vencimiento_default: 30
  },
  created_at: new Date("2024-01-01"),
  updated_at: new Date("2024-01-01")
}

// Configuraciones del sistema
export interface ConfiguracionSistema {
  notificaciones_email: boolean
  notificaciones_push: boolean
  backup_automatico: boolean
  frecuencia_backup: string
  retencion_logs: number
  tema_oscuro: boolean
  idioma_interfaz: string
  formato_numeros: string
  decimales_moneda: number
  separador_miles: string
  separador_decimal: string
}

const configuracionSistema: ConfiguracionSistema = {
  notificaciones_email: true,
  notificaciones_push: false,
  backup_automatico: true,
  frecuencia_backup: "diario",
  retencion_logs: 90,
  tema_oscuro: false,
  idioma_interfaz: "es",
  formato_numeros: "es-AR",
  decimales_moneda: 2,
  separador_miles: ".",
  separador_decimal: ","
}

export class ConfiguracionController {
  // Empresa
  static async getEmpresa(): Promise<Empresa> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { ...empresaData }
  }

  static async updateEmpresa(data: UpdateEmpresaData): Promise<Empresa> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Simular actualización
    Object.assign(empresaData, {
      ...data,
      updated_at: new Date()
    })
    
    return { ...empresaData }
  }

  // Sistema
  static async getConfiguracionSistema(): Promise<ConfiguracionSistema> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { ...configuracionSistema }
  }

  static async updateConfiguracionSistema(data: Partial<ConfiguracionSistema>): Promise<ConfiguracionSistema> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Simular actualización
    Object.assign(configuracionSistema, data)
    
    return { ...configuracionSistema }
  }

  // Métodos utilitarios
  static async uploadLogo(file: File): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simular upload
    const logoUrl = `/logos/${Date.now()}-${file.name}`
    empresaData.logo_url = logoUrl
    empresaData.updated_at = new Date()
    
    return logoUrl
  }

  static async testNotificacion(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true
  }

  static async exportarConfiguracion(): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const config = {
      empresa: empresaData,
      sistema: configuracionSistema,
      exportado_en: new Date().toISOString()
    }
    
    return JSON.stringify(config, null, 2)
  }

  static async importarConfiguracion(configJson: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    try {
      const config = JSON.parse(configJson)
      
      if (config.empresa) {
        Object.assign(empresaData, config.empresa, { updated_at: new Date() })
      }
      
      if (config.sistema) {
        Object.assign(configuracionSistema, config.sistema)
      }
      
      return true
    } catch (error) {
      throw new Error("Formato de configuración inválido")
    }
  }

  static async resetearConfiguracion(): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reset a valores por defecto
    Object.assign(configuracionSistema, {
      notificaciones_email: true,
      notificaciones_push: false,
      backup_automatico: true,
      frecuencia_backup: "diario",
      retencion_logs: 90,
      tema_oscuro: false,
      idioma_interfaz: "es",
      formato_numeros: "es-AR",
      decimales_moneda: 2,
      separador_miles: ".",
      separador_decimal: ","
    })
    
    return true
  }
}
