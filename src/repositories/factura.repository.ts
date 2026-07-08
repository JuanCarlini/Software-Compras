import { createClient } from "@/lib/supabase/service"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"
import type { Factura } from "@/models"

const TABLE = "gu_facturas"
const TABLE_LINEAS = "gu_lineasdefactura"
const TABLE_CERTS = "gu_facturas_certificaciones"

// Repositorio de gu_facturas (+ líneas + puente N:M con certificaciones): única capa
// con queries Supabase para facturas (A1). Solo I/O — la generación del número, el
// aplanado de joins y el orquestado de relaciones viven en FacturaService.
export class FacturaRepository {
  static async findAllWithProveedor(): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select(`*, gu_proveedores(nombre, cuit)`)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async findByIdWithProveedor(id: number): Promise<any | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select(`*, gu_proveedores(nombre, cuit, email, direccion)`)
      .eq("id", id)
      .single()

    if (error || !data) return null
    return data
  }

  static async findLineasByFacturaId(facturaId: number): Promise<any[]> {
    const supabase = createClient()
    const { data } = await supabase.from(TABLE_LINEAS).select("*").eq("factura_id", facturaId)
    return data || []
  }

  static async findCertificacionesByFacturaId(facturaId: number): Promise<any[]> {
    const supabase = createClient()
    const { data } = await supabase
      .from(TABLE_CERTS)
      .select(
        `certificacion_id, gu_certificaciones(id, numero_cert, fecha_cert, total_neto, total_con_iva, estado)`
      )
      .eq("factura_id", facturaId)

    return data || []
  }

  static async findCertificacionesAprobadas(proveedorId: number): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_certificaciones")
      .select("*")
      .eq("proveedor_id", proveedorId)
      .eq("estado", "aprobado")
      .order("fecha_cert", { ascending: false })

    if (error) throw error
    return data || []
  }


  static async insert(factura: TablesInsert<"gu_facturas">): Promise<Factura> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).insert(factura).select().single()
    if (error) throw error
    return data
  }

  static async insertLineas(lineas: TablesInsert<"gu_lineasdefactura">[]): Promise<void> {
    if (!lineas || lineas.length === 0) return
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_LINEAS).insert(lineas)
    if (error) throw error
  }

  static async insertCertificacionRelations(relaciones: { factura_id: number; certificacion_id: number }[]): Promise<void> {
    if (!relaciones || relaciones.length === 0) return
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_CERTS).insert(relaciones)
    if (error) throw error
  }

  static async deleteCertificacionRelations(facturaId: number): Promise<void> {
    const supabase = createClient()
    await supabase.from(TABLE_CERTS).delete().eq("factura_id", facturaId)
  }

  static async update(id: number, factura: TablesUpdate<"gu_facturas">): Promise<Factura | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).update(factura).eq("id", id).select().single()
    if (error) return null
    return data
  }

  static async deleteById(id: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    return !error
  }
}
