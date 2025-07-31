export interface OrdenCompra {
  id: string
  numero: string
  proveedor_id: string
  proveedor_nombre: string
  fecha_creacion: Date
  fecha_entrega: Date
  descripcion: string
  subtotal: number
  impuestos: number
  total: number
  estado: EstadoOrdenCompra
  items: OrdenCompraItem[]
  created_at: Date
  updated_at: Date
}

export interface OrdenCompraItem {
  id: string
  orden_compra_id: string
  producto: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export enum EstadoOrdenCompra {
  PENDIENTE = "Pendiente",
  EN_REVISION = "En Revisión", 
  APROBADA = "Aprobada",
  RECHAZADA = "Rechazada",
  ENVIADA = "Enviada",
  RECIBIDA = "Recibida",
  CANCELADA = "Cancelada"
}

export interface CreateOrdenCompraData {
  proveedor_id: string
  fecha_entrega: Date
  descripcion: string
  items: Omit<OrdenCompraItem, 'id' | 'orden_compra_id'>[]
}

export interface UpdateOrdenCompraData extends Partial<CreateOrdenCompraData> {
  estado?: EstadoOrdenCompra
}
