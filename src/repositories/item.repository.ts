import { createClient } from "@/lib/supabase/service"
import { Item, CreateItemDTO, UpdateItemDTO } from "@/models"

const TABLE = "gu_items"
const TABLE_LINEAS_OC = "gu_lineasdeordenesdecompra"

// Repositorio de gu_items: única capa con queries Supabase para items (A1).
// Solo I/O — el default is_active al crear, el dedup de categorías y la
// interpretación de "en uso" viven en ItemService.
export class ItemRepository {
  static async findAllActive(): Promise<Item[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .order("nombre", { ascending: true })

    if (error) throw error
    return data || []
  }

  static async findAll(): Promise<Item[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).select("*").order("nombre", { ascending: true })
    if (error) throw error
    return data || []
  }

  // `query` viene saneado por ItemService.search (la coma cortaría el filtro .or()).
  static async search(query: string): Promise<Item[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .or(`codigo.ilike.%${query}%,nombre.ilike.%${query}%,descripcion.ilike.%${query}%`)
      .order("nombre", { ascending: true })
      .limit(20)

    if (error) throw error
    return data || []
  }

  static async findById(id: number): Promise<Item | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
    if (error) return null
    return data as Item
  }

  static async insert(item: CreateItemDTO & { is_active: boolean }): Promise<Item> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).insert(item).select().single()
    if (error) throw error
    return data as Item
  }

  static async update(id: number, item: UpdateItemDTO): Promise<Item | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).update(item).eq("id", id).select().single()
    if (error) return null
    return data as Item
  }

  static async setActive(id: number, isActive: boolean): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).update({ is_active: isActive }).eq("id", id)
    return !error
  }

  // ¿el item aparece en alguna línea de OC? (existencia; error se trata como "no en uso")
  static async existsInLineasOC(itemId: number): Promise<boolean> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_LINEAS_OC)
      .select("id")
      .eq("item_id", itemId)
      .limit(1)

    if (error) return false
    return (data?.length ?? 0) > 0
  }

  static async findByCategoria(categoria: string): Promise<Item[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .eq("categoria", categoria)
      .order("nombre", { ascending: true })

    if (error) throw error
    return data || []
  }

  // Valores crudos de 'categoria' (activos, no nulos). El dedup/orden lo hace el service.
  static async findCategoriaValues(): Promise<(string | null)[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("categoria")
      .eq("is_active", true)
      .not("categoria", "is", null)

    if (error) return []
    return (data || []).map((row: any) => row.categoria)
  }
}
