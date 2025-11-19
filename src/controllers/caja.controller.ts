import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Caja = Database['public']['Tables']['cajas']['Row']
type CajaInsert = Database['public']['Tables']['cajas']['Insert']
type CajaUpdate = Database['public']['Tables']['cajas']['Update']

export class CajaService {
  static async getAll(): Promise<Caja[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getActivas(): Promise<Caja[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('estado', 'activa')
      .order('nombre', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<Caja | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async create(data: CajaInsert): Promise<Caja> {
    const supabase = createClient()
    
    const { data: nuevaCaja, error } = await supabase
      .from('cajas')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return nuevaCaja
  }

  static async update(id: string, data: CajaUpdate): Promise<Caja | null> {
    const supabase = createClient()
    
    const { data: cajaActualizada, error } = await supabase
      .from('cajas')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return cajaActualizada
  }

  static async delete(id: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('cajas')
      .delete()
      .eq('id', id)
    
    return !error
  }
}
