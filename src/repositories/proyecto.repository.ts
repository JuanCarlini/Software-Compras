import { createClient } from "@/lib/supabase/service"

const TABLE = "gu_proyectos"

// Repositorio de gu_proyectos: única capa con queries Supabase para proyectos (A1).
export class ProyectoRepository {
  static async findAll(): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async findById(id: number): Promise<any | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
    if (error) return null
    return data
  }

  static async insert(proyecto: any): Promise<any> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).insert(proyecto).select().single()
    if (error) throw error
    return data
  }

  static async update(id: number, proyecto: any): Promise<any | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).update(proyecto).eq("id", id).select().single()
    if (error) return null
    return data
  }

  static async delete(id: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    return !error
  }
}
