import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type OrdenPago = Database['public']['Tables']['ordenes_pago']['Row']
type OrdenPagoInsert = Database['public']['Tables']['ordenes_pago']['Insert']
type OrdenPagoUpdate = Database['public']['Tables']['ordenes_pago']['Update']

interface OrdenPagoWithDetails extends OrdenPago {
  proveedor_nombre?: string
}

export class OrdenPagoService {
  static async getAll(): Promise<OrdenPagoWithDetails[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('ordenes_pago')
      .select(`
        *,
        proveedores(nombre)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data.map(op => ({
      ...op,
      proveedor_nombre: op.proveedores?.nombre
    }))
  }

  static async getById(id: string): Promise<OrdenPagoWithDetails | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('ordenes_pago')
      .select(`
        *,
        proveedores(nombre)
      `)
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    
    return {
      ...data,
      proveedor_nombre: data.proveedores?.nombre
    }
  }

  static async create(data: OrdenPagoInsert): Promise<OrdenPago> {
    const supabase = createClient()
    
    const { data: nuevaOrden, error } = await supabase
      .from('ordenes_pago')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return nuevaOrden
  }

  static async update(id: string, data: OrdenPagoUpdate): Promise<OrdenPago | null> {
    const supabase = createClient()
    
    const { data: ordenActualizada, error } = await supabase
      .from('ordenes_pago')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return ordenActualizada
  }

  static async delete(id: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('ordenes_pago')
      .delete()
      .eq('id', id)
    
    return !error
  }

  static async marcarComoPagada(id: string, referencia: string): Promise<OrdenPago | null> {
    return this.update(id, {
      estado: 'Pagada',
      referencia_bancaria: referencia
    })
  }
}
