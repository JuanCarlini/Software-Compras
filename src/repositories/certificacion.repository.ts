import { createClient } from "@/lib/supabase/service"

const TABLE = "gu_certificaciones"
const TABLE_LINEAS = "gu_lineasdecertificacion"
const TABLE_LINEAS_OC = "gu_lineasdeordenesdecompra"

// Repositorio de gu_certificaciones (+ líneas): única capa con queries Supabase (A1).
// Solo I/O — la generación del número, la compensación anti-huérfanas y el cálculo
// del saldo certificable (regla del 100%) viven en CertificacionService.
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

  static async findLastNumero(): Promise<string | null> {
    const supabase = createClient()
    const { data } = await supabase
      .from(TABLE)
      .select("numero_cert")
      .order("id", { ascending: false })
      .limit(1)
      .single()

    return data?.numero_cert ?? null
  }

  static async insert(cert: any): Promise<any> {
    const supabase = createClient()
    const { data, error } = await supabase.from(TABLE).insert(cert).select().single()
    if (error) throw error
    return data
  }

  static async insertLineas(lineas: any[]): Promise<void> {
    if (!lineas || lineas.length === 0) return
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_LINEAS).insert(lineas)
    if (error) throw error
  }

  static async update(id: number, data: any): Promise<any | null> {
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

  static async findByProyecto(proyectoId: number): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select(`*, gu_proveedores(nombre)`)
      .eq("proyecto_id", proyectoId)
      .order("fecha_cert", { ascending: false })

    if (error) throw error
    return data || []
  }

  // Líneas de OC aprobadas del proveedor (con la OC embebida via !inner). Solo I/O.
  static async findLineasOCAprobadas(proveedorId: number): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_LINEAS_OC)
      .select(
        "id, descripcion, cantidad, precio_unitario_neto, iva_porcentaje, gu_ordenesdecompra!inner(id, numero_oc, estado, proveedor_id)"
      )
      .eq("gu_ordenesdecompra.proveedor_id", proveedorId)
      .eq("gu_ordenesdecompra.estado", "aprobado")
      .order("id", { ascending: true })

    if (error) throw error
    return data || []
  }

  // Certificado acumulado por línea de OC (excluye rechazadas). Solo I/O; el sumado lo hace el service.
  static async findCertificadoByLineaOCIds(ids: number[]): Promise<any[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE_LINEAS)
      .select("linea_oc_id, cantidad, estado")
      .in("linea_oc_id", ids)
      .neq("estado", "rechazado")

    if (error) throw error
    return data || []
  }
}
