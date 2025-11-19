import { createClient } from "@/lib/supabase/client"
import { Proveedor, EstadoProveedor } from "@/models"

export class ProveedorService {
  static async getAll(): Promise<Proveedor[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_proveedores")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    // normalizo estado a 'activo' si viene null
    return (data || []).map((p: any) => ({
      ...p,
      estado: p.estado ?? EstadoProveedor.ACTIVO,
    }))
  }

  static async getById(id: number): Promise<Proveedor | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_proveedores")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null

    return {
      ...data,
      estado: data.estado ?? EstadoProveedor.ACTIVO,
    } as Proveedor
  }

  static async create(proveedor: Partial<Proveedor>): Promise<Proveedor> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_proveedores")
      .insert(proveedor)
      .select()
      .single()

    if (error) throw error
    return data as Proveedor
  }

  static async update(id: number, proveedor: Partial<Proveedor>): Promise<Proveedor | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_proveedores")
      .update(proveedor)
      .eq("id", id)
      .select()
      .single()

    if (error) return null
    return data as Proveedor
  }

  static async delete(id: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from("gu_proveedores").delete().eq("id", id)
    return !error
  }
}
