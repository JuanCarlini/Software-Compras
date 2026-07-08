import { createClient } from "@/lib/supabase/service"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"
import type { Caja } from "@/models"

const TABLE = "gu_cajas"

// Repositorio de gu_cajas: única capa con queries Supabase para cajas (A1).
// Solo I/O — el default is_active, la baja lógica y la inmutabilidad de la moneda
// viven en CajaService.
export class CajaRepository {
  static async findAllActive(): Promise<Caja[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .order("nombre", { ascending: true })

    if (error) throw error
    return data ?? []
  }

  static async findAll(): Promise<Caja[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).select("*").order("nombre", { ascending: true })
    if (error) throw error
    return data ?? []
  }

  static async findById(id: number): Promise<Caja | null> {
    const supabase = createClient()
    const { data } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle()
    return data
  }

  static async insert(caja: TablesInsert<"gu_cajas">): Promise<Caja> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).insert(caja).select().single()
    if (error) throw error
    return data
  }

  static async update(id: number, caja: TablesUpdate<"gu_cajas">): Promise<Caja | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).update(caja).eq("id", id).select().single()
    if (error) return null
    return data
  }

  static async setActive(id: number, isActive: boolean): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).update({ is_active: isActive }).eq("id", id)
    return !error
  }
}
