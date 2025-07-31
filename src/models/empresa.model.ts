export interface Empresa {
  id: string
  razon_social: string
  nombre_comercial: string
  rut: string
  direccion: string
  ciudad: string
  pais: string
  telefono: string
  email: string
  sitio_web?: string
  logo_url?: string
  configuracion: ConfiguracionEmpresa
  created_at: Date
  updated_at: Date
}

export interface ConfiguracionEmpresa {
  moneda_default: string
  idioma: string
  zona_horaria: string
  formato_fecha: string
  iva_default: number
  prefijo_orden_compra: string
  prefijo_orden_pago: string
  dias_vencimiento_default: number
}

export interface UpdateEmpresaData extends Partial<Omit<Empresa, 'id' | 'created_at' | 'updated_at'>> {}
