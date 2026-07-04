export interface Caja {
  id: string
  nombre: string
  tipo: TipoCaja
  moneda: string
  banco: string | null
  numero_cuenta: string | null
  saldo_actual: number
  estado: EstadoCaja
  notas: string | null
  created_at: Date
  updated_at: Date
}

export enum TipoCaja {
  EFECTIVO = "efectivo",
  BANCO = "banco",
  TARJETA = "tarjeta"
}

export enum EstadoCaja {
  ACTIVA = "activa",
  INACTIVA = "inactiva"
}

export interface CreateCajaData {
  nombre: string
  tipo: TipoCaja
  moneda: string
  banco?: string
  numero_cuenta?: string
  saldo_actual?: number
  estado?: EstadoCaja
  notas?: string
}

export interface UpdateCajaData extends Partial<CreateCajaData> {}
