import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Proveedor = Database['public']['Tables']['proveedores']['Row']
type ProveedorInsert = Database['public']['Tables']['proveedores']['Insert']
type ProveedorUpdate = Database['public']['Tables']['proveedores']['Update']

export class ProveedorService {
  static async getAll(): Promise<Proveedor[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Proveedor | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async create(proveedor: ProveedorInsert): Promise<Proveedor> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('proveedores')
      .insert(proveedor)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, proveedor: ProveedorUpdate): Promise<Proveedor | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('proveedores')
      .update(proveedor)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  static async delete(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id)
    
    return !error
  }
}
