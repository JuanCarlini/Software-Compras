// src/controllers/OrdenCompraService.ts
import { createClient } from "@/lib/supabase/client"
import {
  CreateOrdenCompraData,
  CreateOrdenCompraLinea,
  OrdenCompra,
  OrdenCompraLinea,
  OrdenCompraLineaConItem,
  CreateLineaFromItem,
} from "@/models/orden-compra.model"
import { ItemService } from "./item.controller"

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

  // NUEVO: Obtener líneas con información del item del catálogo
  static async getLinesWithItems(ordenId: number): Promise<OrdenCompraLineaConItem[]> {
    const supabase = createClient()
    
    // Obtener líneas con LEFT JOIN a gu_items
    const { data, error } = await supabase
      .from(TABLE_OC_LINEAS)
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

  // NUEVO: Crear línea desde un item del catálogo
  static async createLineFromItem(
    ordenId: number,
    lineaData: CreateLineaFromItem
  ): Promise<OrdenCompraLinea> {
    const supabase = createClient()
    
    // Obtener información del item
    const item = await ItemService.getById(lineaData.item_id)
    if (!item) {
      throw new Error(`Item con ID ${lineaData.item_id} no encontrado`)
    }

    // Usar precio sugerido si no se provee uno específico
    const precioUnitario = lineaData.precio_unitario_neto ?? item.precio_sugerido ?? 0
    const ivaPorcentaje = lineaData.iva_porcentaje ?? 21
    const cantidad = lineaData.cantidad

    // Calcular totales
    const totalNeto = precioUnitario * cantidad
    const totalConIva = totalNeto * (1 + ivaPorcentaje / 100)

    // Usar nombre del item como descripción si no se provee
    const descripcion = lineaData.descripcion || item.nombre

    const nuevaLinea: CreateOrdenCompraLinea = {
      orden_compra_id: ordenId,
      item_id: item.id,
      descripcion,
      cantidad,
      precio_unitario_neto: precioUnitario,
      iva_porcentaje: ivaPorcentaje,
      total_neto: totalNeto,
      total_con_iva: totalConIva,
      estado: "borrador"
    }

    const { data, error } = await supabase
      .from(TABLE_OC_LINEAS)
      .insert(nuevaLinea)
      .select()
      .single()

    if (error) throw error
    return data as OrdenCompraLinea
  }

  // NUEVO: Actualizar una línea existente
  static async updateLine(
    lineaId: number,
    updates: Partial<CreateOrdenCompraLinea>
  ): Promise<OrdenCompraLinea | null> {
    const supabase = createClient()
    
    // Si se actualizan cantidad o precio, recalcular totales
    if (updates.cantidad !== undefined || updates.precio_unitario_neto !== undefined || updates.iva_porcentaje !== undefined) {
      const { data: lineaActual } = await supabase
        .from(TABLE_OC_LINEAS)
        .select("*")
        .eq("id", lineaId)
        .single()

      if (lineaActual) {
        const cantidad = updates.cantidad ?? lineaActual.cantidad
        const precio = updates.precio_unitario_neto ?? lineaActual.precio_unitario_neto
        const iva = updates.iva_porcentaje ?? lineaActual.iva_porcentaje

        updates.total_neto = cantidad * precio
        updates.total_con_iva = updates.total_neto * (1 + iva / 100)
      }
    }

    const { data, error } = await supabase
      .from(TABLE_OC_LINEAS)
      .update(updates)
      .eq("id", lineaId)
      .select()
      .single()

    if (error) return null
    return data as OrdenCompraLinea
  }

  // NUEVO: Eliminar una línea
  static async deleteLine(lineaId: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase
      .from(TABLE_OC_LINEAS)
      .delete()
      .eq("id", lineaId)

    return !error
  }
}
