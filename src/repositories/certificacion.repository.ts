import { createClient } from "@/lib/supabase/service"
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"
import type { Certificacion } from "@/models"
import type { LocRollup } from "@/models"

const TABLE = "gu_certificaciones"
const TABLE_LINEAS = "gu_lineasdecertificacion"
const TABLE_LINEAS_OC = "gu_lineasdeordenesdecompra"

// Repositorio de gu_certificaciones (+ líneas): única capa con queries Supabase (A1).
// Solo I/O — la compensación anti-huérfanas vive en CertificacionService. El número
// (CE-N.s) lo genera la DB; la regla del 100% la garantiza el trigger fn_check_avance_100
// y el avance disponible lo calcula la vista v_loc_rollup.
export class CertificacionRepository {
  static async findAllWithRelations(): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select(`*, gu_proyectos(nombre, codigo), gu_proveedores(nombre)`)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async findByIdWithRelations(id: number): Promise<any | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select(`*, gu_proyectos(nombre, codigo), gu_proveedores(nombre, cuit, email)`)
      .eq("id", id)
      .single()

    if (error || !data) return null
    return data
  }

  static async findLineasByCertId(certId: number): Promise<any[]> {
    const supabase = createClient()
    const { data } = await supabase
      .from(TABLE_LINEAS)
      .select("*, gu_lineasdeordenesdecompra(id, descripcion, cantidad, gu_ordenesdecompra(id, numero_oc))")
      .eq("certificacion_id", certId)
      .order("id", { ascending: true })

    return data || []
  }


  static async insert(cert: TablesInsert<"gu_certificaciones">): Promise<Certificacion> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).insert(cert).select().single()
    if (error) throw error
    return data
  }

  static async insertLineas(lineas: TablesInsert<"gu_lineasdecertificacion">[]): Promise<void> {
    if (!lineas || lineas.length === 0) return
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_LINEAS).insert(lineas)
    if (error) throw error
  }

  static async update(id: number, data: TablesUpdate<"gu_certificaciones">): Promise<Certificacion | null> {
    const supabase = createClient()
    const { data: updated, error } = await supabase.from(TABLE).update(data).eq("id", id).select().single()
    if (error) return null
    return updated
  }

  static async deleteById(id: number): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE).delete().eq("id", id)
    return !error
  }

  // Líneas de OC aprobadas del proveedor (con la OC embebida via !inner). Solo I/O.
  static async findLineasOCAprobadas(proveedorId: number): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_LINEAS_OC)
      .select(
        "id, numero_loc, descripcion, cantidad, precio_unitario_neto, iva_porcentaje, gu_ordenesdecompra!inner(id, numero_oc, estado, proveedor_id)"
      )
      .eq("gu_ordenesdecompra.proveedor_id", proveedorId)
      .eq("gu_ordenesdecompra.estado", "aprobado")
      .order("id", { ascending: true })

    if (error) throw error
    return data || []
  }

  // Avance por línea de OC: lo calcula la vista v_loc_rollup (solo CE aprobadas),
  // no la app. Antes esto se acumulaba a mano en JS sumando gu_lineasdecertificacion.
  static async findLocRollupsByIds(ids: number[]): Promise<LocRollup[]> {
    if (ids.length === 0) return []
    const supabase = createClient()
    const { data, error } = await supabase.from("v_loc_rollup").select("*").in("linea_oc_id", ids)
    if (error) throw error
    return data ?? []
  }
}
