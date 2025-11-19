// src/controllers/OrdenCompraService.ts
import { createClient } from "@/lib/supabase/client"
import {
  CreateOrdenCompraData,
  CreateOrdenCompraLinea,
  OrdenCompra,
  OrdenCompraLinea,
} from "@/models/orden-compra.model"

const TABLE_OC = "gu_ordenesdecompra"
const TABLE_OC_LINEAS = "gu_lineasdeordenesdecompra"

export class OrdenCompraService {
  static async getAll(): Promise<OrdenCompra[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_OC)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data || []) as OrdenCompra[]
  }

  static async getById(id: number): Promise<OrdenCompra | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_OC)
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data as OrdenCompra
  }

  // crea la OC (cabecera)
  static async create(payload: CreateOrdenCompraData): Promise<OrdenCompra> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_OC)
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as OrdenCompra
  }

  // crea las líneas para una OC ya creada
  static async createLines(lines: CreateOrdenCompraLinea[]): Promise<OrdenCompraLinea[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_OC_LINEAS)
      .insert(lines)
      .select()

    if (error) throw error
    return (data || []) as OrdenCompraLinea[]
  }
  static async getLinesByOrdenId(ordenId: number) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_OC_LINEAS)
      .select("*")
      .eq("orden_compra_id", ordenId)
      .order("id", { ascending: true })

    if (error) throw error
    return data || []
  }

  static async update(id: string | number, payload: Partial<OrdenCompra>): Promise<OrdenCompra | null> {
    const supabase = createClient()
    console.log("OrdenCompraService.update - ID:", id, "Payload:", payload)
    
    const { data, error } = await supabase
      .from(TABLE_OC)
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("OrdenCompraService.update - Error:", error)
      throw error
    }
    
    console.log("OrdenCompraService.update - Success:", data)
    return data as OrdenCompra
  }

  static async delete(id: string | number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLE_OC)
      .delete()
      .eq("id", id)

    return !error
  }
}
