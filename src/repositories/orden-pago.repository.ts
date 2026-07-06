import { createClient } from "@/lib/supabase/service"

const TABLE = "gu_ordenesdepago"
const TABLE_LINEAS = "gu_lineasdeordenesdepago"

// Repositorio de gu_ordenesdepago (+ sus líneas): ÚNICA capa con queries Supabase
// para OP. Solo I/O — la generación del número y el armado de líneas (reglas) viven
// en OrdenPagoService. Los tipos son `any` porque el cliente Supabase no está tipado
// y el controller original ya lo era (tiparlos es P2, un paso aparte).
export class OrdenPagoRepository {
  static async findAllWithProveedor(): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*, gu_proveedores(nombre)")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async findById(id: number): Promise<any | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data
  }

  // Último numero_op registrado, para calcular el siguiente. Solo I/O:
  // el parseo/incremento es regla de negocio y vive en el service.
  static async findLastNumero(): Promise<string | null> {
    const supabase = createClient()
    const { data } = await supabase
      .from(TABLE)
      .select("numero_op")
      .order("id", { ascending: false })
      .limit(1)
      .single()

    return data?.numero_op ?? null
  }

  static async insert(orden: any): Promise<any> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .insert(orden)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async insertLineas(lineas: any[]): Promise<void> {
    if (!lineas || lineas.length === 0) return
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_LINEAS).insert(lineas)
    if (error) throw error
  }

  static async update(id: number, payload: any): Promise<any> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    if (error) throw error
    return true
  }
}
