export interface OrdenPago {
  id: number
  numero_op: string
  proveedor_id: number
  fecha_op: string
  total_pago: number
  estado: EstadoOrdenPago
  observaciones?: string | null
  created_at: string
}

export enum EstadoOrdenPago {
  PENDIENTE = "pendiente",
  APROBADO = "aprobado",
  RECHAZADO = "rechazado",
  PAGADO = "pagado"
}

export enum MetodoPago {
  TRANSFERENCIA = "transferencia",
  CHEQUE = "cheque",
  EFECTIVO = "efectivo",
  RETENCION = "retencion"
}

export interface CreateOrdenPagoData {
  proveedor_id: number
  fecha_op: string
  total_pago: number
  estado?: EstadoOrdenPago
  observaciones?: string
  lineas?: any[]
}

export interface UpdateOrdenPagoData extends Partial<CreateOrdenPagoData> {
  estado?: EstadoOrdenPago
}
