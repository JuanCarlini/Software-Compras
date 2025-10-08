import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type OrdenCompra = Database['public']['Tables']['ordenes_compra']['Row']
type OrdenCompraInsert = Database['public']['Tables']['ordenes_compra']['Insert']
type OrdenCompraUpdate = Database['public']['Tables']['ordenes_compra']['Update']
type OrdenCompraItem = Database['public']['Tables']['ordenes_compra_items']['Row']

interface OrdenCompraWithItems extends OrdenCompra {
  items?: OrdenCompraItem[]
  proveedor_nombre?: string
}

export class OrdenCompraService {
  static async getAll(): Promise<OrdenCompraWithItems[]> {
    const supabase = createClient()
    
    const { data: ordenes, error } = await supabase
      .from('ordenes_compra')
      .select(`
        *,
        proveedores(nombre)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return ordenes.map(orden => ({
      ...orden,
      proveedor_nombre: orden.proveedores?.nombre
    }))
  }

  static async getById(id: string): Promise<OrdenCompraWithItems | null> {
    const supabase = createClient()
    
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes_compra')
      .select(`
        *,
        proveedores(nombre)
      `)
      .eq('id', id)
      .single()
    
    if (ordenError || !orden) return null
    
    const { data: items } = await supabase
      .from('ordenes_compra_items')
      .select('*')
      .eq('orden_compra_id', id)
    
    return {
      ...orden,
      proveedor_nombre: orden.proveedores?.nombre,
      items: items || []
    }
  }

  static async create(data: OrdenCompraInsert & { items: Omit<OrdenCompraItem, 'id' | 'orden_compra_id'>[] }): Promise<OrdenCompra> {
    const supabase = createClient()
    
    const { items, ...ordenData } = data
    
    const { data: nuevaOrden, error: ordenError } = await supabase
      .from('ordenes_compra')
      .insert(ordenData)
      .select()
      .single()
    
    if (ordenError) throw ordenError
    
    if (items && items.length > 0) {
      const itemsData = items.map(item => ({
        ...item,
        orden_compra_id: nuevaOrden.id
      }))
      
      await supabase
        .from('ordenes_compra_items')
        .insert(itemsData)
    }
    
    return nuevaOrden
  }

  static async update(id: string, data: OrdenCompraUpdate): Promise<OrdenCompra | null> {
    const supabase = createClient()
    
    const { data: ordenActualizada, error } = await supabase
      .from('ordenes_compra')
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
      .from('ordenes_compra')
      .delete()
      .eq('id', id)
    
    return !error
  }
}
