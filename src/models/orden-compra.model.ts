// src/models/orden-compra.ts

export type OcEstado = "borrador" | "en_aprobacion" | "aprobado" | "rechazado" | "anulado"
export type MonedaOc = "ARS" | "USD" | "EUR" // ajustá a tu enum

export interface OrdenCompra {
  id: number
  numero_oc: string
  proveedor_id: number
  proyecto_id: number | null
  fecha_oc: string            // YYYY-MM-DD
  moneda: MonedaOc
  total_neto: number
  total_iva: number
  total_con_iva: number
  estado: OcEstado
  observaciones: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

export interface CreateOrdenCompraData {
  numero_oc: string
  proveedor_id: number
  proyecto_id?: number | null
  fecha_oc: string           // YYYY-MM-DD
  moneda?: MonedaOc
  total_neto: number
  total_iva: number
  total_con_iva: number
  estado?: OcEstado
  observaciones?: string | null
}

export interface OrdenCompraLinea {
  id: number
  orden_compra_id: number
  item_codigo: string | null
  descripcion: string
  cantidad: number
  precio_unitario_neto: number
  iva_porcentaje: number
  total_neto: number
  total_con_iva: number
  estado: string | null
}

export interface CreateOrdenCompraLinea {
  orden_compra_id: number
  item_codigo?: string | null
  descripcion: string
  cantidad: number
  precio_unitario_neto: number
  iva_porcentaje: number
  total_neto: number
  total_con_iva: number
  estado?: string | null
}
