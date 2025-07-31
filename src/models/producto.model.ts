export interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  categoria_id: string
  categoria_nombre: string
  precio_unitario: number
  unidad_medida: UnidadMedida
  stock_actual: number
  stock_minimo: number
  estado: EstadoProducto
  proveedor_id?: string
  created_at: Date
  updated_at: Date
}

export interface CategoriaProducto {
  id: string
  nombre: string
  descripcion?: string
  estado: EstadoCategoria
}

export enum UnidadMedida {
  UNIDAD = "Unidad",
  KG = "Kilogramo", 
  LITRO = "Litro",
  METRO = "Metro",
  CAJA = "Caja",
  PAQUETE = "Paquete"
}

export enum EstadoProducto {
  ACTIVO = "Activo",
  INACTIVO = "Inactivo",
  DESCONTINUADO = "Descontinuado"
}

export enum EstadoCategoria {
  ACTIVA = "Activa",
  INACTIVA = "Inactiva"
}

export interface CreateProductoData {
  codigo: string
  nombre: string
  descripcion: string
  categoria_id: string
  precio_unitario: number
  unidad_medida: UnidadMedida
  stock_minimo: number
  proveedor_id?: string
}

export interface UpdateProductoData extends Partial<CreateProductoData> {
  estado?: EstadoProducto
  stock_actual?: number
}
