export interface OrdenPago {
  id: string
  numero: string
  orden_compra_id: string
  proveedor_id: string
  proveedor_nombre: string
  fecha_creacion: Date
  fecha_vencimiento: Date
  monto: number
  moneda: string
  estado: EstadoOrdenPago
  metodo_pago: MetodoPago
  referencia_bancaria?: string
  observaciones?: string
  created_at: Date
  updated_at: Date
}

export enum EstadoOrdenPago {
  PENDIENTE = "Pendiente",
  APROBADA = "Aprobada",
  PAGADA = "Pagada",
  RECHAZADA = "Rechazada",
  VENCIDA = "Vencida"
}

export enum MetodoPago {
  TRANSFERENCIA = "Transferencia",
  CHEQUE = "Cheque",
  EFECTIVO = "Efectivo",
  TARJETA = "Tarjeta"
}

export interface CreateOrdenPagoData {
  orden_compra_id: string
  proveedor_id: string
  fecha_vencimiento: Date
  monto: number
  moneda: string
  metodo_pago: MetodoPago
  observaciones?: string
}

export interface UpdateOrdenPagoData extends Partial<CreateOrdenPagoData> {
  estado?: EstadoOrdenPago
  referencia_bancaria?: string
}
