export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      proveedores: {
        Row: {
          id: string
          nombre: string
          rfc: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          ciudad: string | null
          pais: string | null
          sitio_web: string | null
          notas: string | null
          estado: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          rfc?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          pais?: string | null
          sitio_web?: string | null
          notas?: string | null
          estado?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre?: string
          rfc?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          pais?: string | null
          sitio_web?: string | null
          notas?: string | null
          estado?: string
        }
      }
      ordenes_compra: {
        Row: {
          id: string
          numero: string
          proveedor_id: string
          fecha_creacion: string
          fecha_entrega: string
          descripcion: string
          subtotal: number
          impuestos: number
          total: number
          estado: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero: string
          proveedor_id: string
          fecha_creacion: string
          fecha_entrega: string
          descripcion: string
          subtotal: number
          impuestos: number
          total: number
          estado?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          numero?: string
          proveedor_id?: string
          fecha_creacion?: string
          fecha_entrega?: string
          descripcion?: string
          subtotal?: number
          impuestos?: number
          total?: number
          estado?: string
        }
      }
      ordenes_compra_items: {
        Row: {
          id: string
          orden_compra_id: string
          producto: string
          descripcion: string
          cantidad: number
          precio_unitario: number
          subtotal: number
        }
        Insert: {
          id?: string
          orden_compra_id: string
          producto: string
          descripcion: string
          cantidad: number
          precio_unitario: number
          subtotal: number
        }
        Update: {
          producto?: string
          descripcion?: string
          cantidad?: number
          precio_unitario?: number
          subtotal?: number
        }
      }
      ordenes_pago: {
        Row: {
          id: string
          numero: string
          orden_compra_id: string | null
          caja_id: string
          proveedor_id: string
          fecha_pago: string
          monto: number
          metodo_pago: string
          referencia: string | null
          descripcion: string | null
          estado: string
          comprobante_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero: string
          orden_compra_id?: string | null
          caja_id: string
          proveedor_id: string
          fecha_pago: string
          monto: number
          metodo_pago: string
          referencia?: string | null
          descripcion?: string | null
          estado?: string
          comprobante_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          numero?: string
          orden_compra_id?: string | null
          caja_id?: string
          proveedor_id?: string
          fecha_pago?: string
          monto?: number
          metodo_pago?: string
          referencia?: string | null
          descripcion?: string | null
          estado?: string
          comprobante_url?: string | null
        }
      }
      cajas: {
        Row: {
          id: string
          nombre: string
          tipo: string
          moneda: string
          banco: string | null
          numero_cuenta: string | null
          saldo_actual: number
          estado: string
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          tipo: string
          moneda?: string
          banco?: string | null
          numero_cuenta?: string | null
          saldo_actual?: number
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nombre?: string
          tipo?: string
          moneda?: string
          banco?: string | null
          numero_cuenta?: string | null
          saldo_actual?: number
          estado?: string
          notas?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
