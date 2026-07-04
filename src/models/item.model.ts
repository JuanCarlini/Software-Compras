// Item Model - Catálogo de productos y servicios reutilizables

export interface Item {
  id: number
  nombre: string
  descripcion?: string | null
  precio_sugerido?: number | null
  unidad_medida?: string | null
  categoria?: string | null
  is_active: boolean
  created_by?: number | null
  created_at: string
  updated_at: string
}

export interface CreateItemDTO {
  nombre: string
  descripcion?: string | null
  precio_sugerido?: number | null
  unidad_medida?: string | null
  categoria?: string | null
  created_by?: number | null
}

export interface UpdateItemDTO {
  nombre?: string
  descripcion?: string | null
  precio_sugerido?: number | null
  unidad_medida?: string | null
  categoria?: string | null
  is_active?: boolean
}

// Categorías comunes para items (puedes expandir según necesidad)
export enum ItemCategoria {
  MATERIALES = 'Materiales',
  SERVICIOS = 'Servicios',
  EQUIPOS = 'Equipos',
  HERRAMIENTAS = 'Herramientas',
  SUMINISTROS = 'Suministros',
  OTROS = 'Otros'
}

// Unidades de medida comunes
export enum UnidadMedida {
  UNIDADES = 'unidades',
  KG = 'kg',
  LITROS = 'litros',
  METROS = 'metros',
  M2 = 'm²',
  M3 = 'm³',
  HORAS = 'horas',
  DIAS = 'días',
  CAJAS = 'cajas',
  BOLSAS = 'bolsas'
}
