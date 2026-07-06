import { createClient } from "@/lib/supabase/service"
import {
  OrdenCompra,
  OrdenCompraLinea,
  OrdenCompraLineaConItem,
  CreateOrdenCompraLinea,
} from "@/models/orden-compra.model"

const TABLE = "gu_ordenesdecompra"
const TABLE_LINEAS = "gu_lineasdeordenesdecompra"

// Repositorio de gu_ordenesdecompra (+ líneas): única capa con queries Supabase (A1).
// Solo I/O — el default de estado, la compensación anti-huérfanas y el cálculo de
// totales de línea (precio/IVA) viven en OrdenCompraService.
export class OrdenCompraRepository {
  static async findAll(): Promise<OrdenCompra[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false })
    if (error) throw error
    return (data || []) as OrdenCompra[]
  }

  static async findById(id: number): Promise<OrdenCompra | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
    if (error) return null
    return data as OrdenCompra
  }

  static async insert(oc: any): Promise<OrdenCompra> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).insert(oc).select().single()
    if (error) throw error
    return data as OrdenCompra
  }

  // Inserta líneas sin devolverlas (usado por create; error se propaga para compensar).
  static async insertLineas(lineas: any[]): Promise<void> {
    if (!lineas || lineas.length === 0) return
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_LINEAS).insert(lineas)
    if (error) throw error
  }

  // Inserta líneas y las devuelve (usado por createLines).
  static async insertLineasReturning(lineas: CreateOrdenCompraLinea[]): Promise<OrdenCompraLinea[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE_LINEAS).insert(lineas).select()
    if (error) throw error
    return (data || []) as OrdenCompraLinea[]
  }

  static async findLineasByOrdenId(ordenId: number): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_LINEAS)
      .select("*")
      .eq("orden_compra_id", ordenId)
      .order("id", { ascending: true })

    if (error) throw error
    return data || []
  }

  static async update(id: string | number, payload: Partial<OrdenCompra>): Promise<OrdenCompra> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).update(payload).eq("id", id).select().single()
    if (error) throw error
    return data as OrdenCompra
  }

  static async deleteById(id: string | number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    return !error
  }

  static async findLineasWithItems(ordenId: number): Promise<OrdenCompraLineaConItem[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_LINEAS)
      .select(`
        *,
        item:item_id (
          id,
          nombre,
          descripcion,
          precio_sugerido,
          unidad_medida,
          categoria
        )
      `)
      .eq("orden_compra_id", ordenId)
      .order("id", { ascending: true })

    if (error) throw error
    return (data || []) as OrdenCompraLineaConItem[]
  }

  // Línea por id (para recalcular totales en updateLine). Error/no encontrada -> null.
  static async findLineaById(lineaId: number): Promise<any | null> {
    const supabase = createClient()
    const { data } = await supabase.from(TABLE_LINEAS).select("*").eq("id", lineaId).single()
    return data ?? null
  }

  static async insertLinea(linea: CreateOrdenCompraLinea): Promise<OrdenCompraLinea> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE_LINEAS).insert(linea).select().single()
    if (error) throw error
    return data as OrdenCompraLinea
  }

  static async updateLinea(
    lineaId: number,
    updates: Partial<CreateOrdenCompraLinea>
  ): Promise<OrdenCompraLinea | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE_LINEAS).update(updates).eq("id", lineaId).select().single()
    if (error) return null
    return data as OrdenCompraLinea
  }

  static async deleteLinea(lineaId: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_LINEAS).delete().eq("id", lineaId)
    return !error
  }
}
