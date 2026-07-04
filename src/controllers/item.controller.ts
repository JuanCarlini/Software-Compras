import { createClient } from "@/lib/supabase/client"
import { Item, CreateItemDTO, UpdateItemDTO } from "@/models"

export class ItemService {
  /**
   * Obtener todos los items activos
   */
  static async getAll(): Promise<Item[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_items")
      .select("*")
      .eq("is_active", true)
      .order("nombre", { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Obtener todos los items (incluyendo inactivos)
   */
  static async getAllIncludingInactive(): Promise<Item[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_items")
      .select("*")
      .order("nombre", { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Buscar items por nombre (búsqueda de texto completo)
   */
  static async search(query: string): Promise<Item[]> {
    const supabase = createClient()
    
    // Búsqueda usando ILIKE para coincidencias parciales
    const { data, error } = await supabase
      .from("gu_items")
      .select("*")
      .eq("is_active", true)
      .or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%`)
      .order("nombre", { ascending: true })
      .limit(20)

    if (error) throw error
    return data || []
  }

  /**
   * Obtener un item por ID
   */
  static async getById(id: number): Promise<Item | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_items")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data as Item
  }

  /**
   * Crear un nuevo item
   */
  static async create(item: CreateItemDTO): Promise<Item> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("gu_items")
      .insert({
        ...item,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data as Item
  }

  /**
   * Actualizar un item existente
   */
  static async update(id: number, item: UpdateItemDTO): Promise<Item | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("gu_items")
      .update(item)
      .eq("id", id)
      .select()
      .single()

    if (error) return null
    return data as Item
  }

  /**
   * Soft delete - Marcar item como inactivo
   */
  static async softDelete(id: number): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from("gu_items")
      .update({ is_active: false })
      .eq("id", id)

    return !error
  }

  /**
   * Reactivar un item
   */
  static async reactivate(id: number): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from("gu_items")
      .update({ is_active: true })
      .eq("id", id)

    return !error
  }

  /**
   * Verificar si un item está en uso en alguna orden de compra
   */
  static async isInUse(id: number): Promise<boolean> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("gu_lineasdeordenesdecompra")
      .select("id")
      .eq("item_id", id)
      .limit(1)

    if (error) return false
    return (data?.length ?? 0) > 0
  }

  /**
   * Obtener items por categoría
   */
  static async getByCategoria(categoria: string): Promise<Item[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("gu_items")
      .select("*")
      .eq("is_active", true)
      .eq("categoria", categoria)
      .order("nombre", { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Obtener todas las categorías únicas
   */
  static async getCategorias(): Promise<string[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("gu_items")
      .select("categoria")
      .eq("is_active", true)
      .not("categoria", "is", null)

    if (error) return []
    
    // Extraer categorías únicas
    const categorias = [...new Set(data.map(item => item.categoria).filter(Boolean))]
    return categorias.sort()
  }
}
