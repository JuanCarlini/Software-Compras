import { createClient } from '@/lib/supabase/client'

export class ProyectoService {
  static async getAll() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gu_proyectos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: number) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gu_proyectos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async create(proyecto: any) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gu_proyectos')
      .insert(proyecto)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: number, proyecto: any) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gu_proyectos')
      .update(proyecto)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null
    return data
  }

  static async delete(id: number) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('gu_proyectos')
      .delete()
      .eq('id', id)
    
    return !error
  }
}
