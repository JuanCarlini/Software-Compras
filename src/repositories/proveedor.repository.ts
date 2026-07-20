import { createClient } from "@/lib/supabase/service"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"
import { Proveedor } from "@/models"

const TABLE = "gu_proveedores"

// Repositorio de gu_proveedores: ÚNICA capa que ejecuta queries Supabase para
// proveedores. Solo I/O — nada de reglas de negocio (la normalización de estado
// y los defaults viven en ProveedorService). Es el patrón de referencia del
// refactor a 4 capas (A1): extraer las queries de los *Service para poder testear
// la lógica con el repo mockeado (sinergia con T09).
export class ProveedorRepository {
  static async findAll(): Promise<Proveedor[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data || []) as Proveedor[]
  }

  static async findById(id: number): Promise<Proveedor | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data as Proveedor
  }

  static async insert(proveedor: TablesInsert<"gu_proveedores">): Promise<Proveedor> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .insert(proveedor)
      .select()
      .single()

    if (error) throw error
    return data as Proveedor
  }

  static async update(id: number, proveedor: TablesUpdate<"gu_proveedores">): Promise<Proveedor | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .update(proveedor)
      .eq("id", id)
      .select()
      .single()

    if (error) return null
    return data as Proveedor
  }

  static async delete(id: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    return !error
  }
}
