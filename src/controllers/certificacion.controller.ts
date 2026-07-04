import { createClient } from "@/lib/supabase/client"

const TABLE_CERT = "gu_certificaciones"
const TABLE_CERT_LINEAS = "gu_lineasdecertificacion"

export class CertificacionService {
  static async getAll() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from(TABLE_CERT)
      .select(
        `
        *,
        gu_proyectos(nombre, codigo),
        gu_proveedores(nombre)
      `
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    return (data || []).map((cert) => ({
      ...cert,
      proyecto_nombre: cert.gu_proyectos?.nombre,
      proyecto_codigo: cert.gu_proyectos?.codigo,
      proveedor_nombre: cert.gu_proveedores?.nombre,
    }))
  }

  static async getById(id: number) {
    const supabase = createClient()

    const { data: cert, error } = await supabase
      .from(TABLE_CERT)
      .select(
        `
        *,
        gu_proyectos(nombre, codigo),
        gu_proveedores(nombre, cuit, email)
      `
      )
      .eq("id", id)
      .single()

    if (error || !cert) return null

    const { data: lineas } = await supabase
      .from(TABLE_CERT_LINEAS)
      .select("*, gu_lineasdeordenesdecompra(id, descripcion, cantidad, gu_ordenesdecompra(id, numero_oc))")
      .eq("certificacion_id", id)
      .order("id", { ascending: true })

    return {
      ...cert,
      proyecto_nombre: cert.gu_proyectos?.nombre,
      proyecto_codigo: cert.gu_proyectos?.codigo,
      proveedor_nombre: cert.gu_proveedores?.nombre,
      proveedor_cuit: cert.gu_proveedores?.cuit,
      proveedor_email: cert.gu_proveedores?.email,
      lineas: lineas || [],
    }
  }

  static async create(data: any) {
    const supabase = createClient()

    const { lineas, ...certData } = data

    // Generar número automático CERT-YYYY-NNN
    const { data: ultimaCert } = await supabase
      .from(TABLE_CERT)
      .select('numero_cert')
      .order('id', { ascending: false })
      .limit(1)
      .single()
    
    let nuevoNumero = `CERT-${new Date().getFullYear()}-001`
    if (ultimaCert?.numero_cert) {
      const match = ultimaCert.numero_cert.match(/CERT-(\d{4})-(\d{3})/)
      if (match) {
        const year = new Date().getFullYear()
        const lastYear = parseInt(match[1])
        const lastNum = parseInt(match[2])
        
        // Si es el mismo año, incrementar; si no, empezar desde 001
        if (year === lastYear) {
          nuevoNumero = `CERT-${year}-${(lastNum + 1).toString().padStart(3, '0')}`
        } else {
          nuevoNumero = `CERT-${year}-001`
        }
      }
    }

    const { data: nuevaCert, error } = await supabase
      .from(TABLE_CERT)
      .insert({
        ...certData,
        numero_cert: nuevoNumero
      })
      .select()
      .single()

    if (error) throw error

    if (lineas && lineas.length > 0) {
      const lineasData = lineas.map((linea: any) => ({
        ...linea,
        certificacion_id: nuevaCert.id,
      }))

      const { error: lineasError } = await supabase
        .from(TABLE_CERT_LINEAS)
        .insert(lineasData)

      if (lineasError) {
        // compensación: sin transacciones en el cliente, borramos la cabecera
        // para no dejar una certificación huérfana si el trigger rechazó las líneas
        await supabase.from(TABLE_CERT).delete().eq("id", nuevaCert.id)
        throw lineasError
      }
    }

    return nuevaCert
  }

  static async update(id: number, data: any) {
    const supabase = createClient()
    const { data: certActualizada, error } = await supabase
      .from(TABLE_CERT)
      .update(data)
      .eq("id", id)
      .select()
      .single()

    if (error) return null
    return certActualizada
  }

  static async delete(id: number) {
    const supabase = createClient()
    const { error } = await supabase.from(TABLE_CERT).delete().eq("id", id)
    return !error
  }

  /**
   * Líneas de OCs aprobadas del proveedor con su saldo certificable.
   * La regla del 100% la garantiza el trigger check_certificacion_max_100 en la DB;
   * esto alimenta el formulario para que el usuario vea el disponible antes de enviar.
   */
  static async getLineasOCDisponibles(proveedorId: number) {
    const supabase = createClient()

    const { data: lineasOC, error } = await supabase
      .from("gu_lineasdeordenesdecompra")
      .select("id, descripcion, cantidad, precio_unitario_neto, iva_porcentaje, gu_ordenesdecompra!inner(id, numero_oc, estado, proveedor_id)")
      .eq("gu_ordenesdecompra.proveedor_id", proveedorId)
      .eq("gu_ordenesdecompra.estado", "aprobado")
      .order("id", { ascending: true })

    if (error) throw error
    if (!lineasOC || lineasOC.length === 0) return []

    // Certificado acumulado por línea de OC (excluye rechazadas)
    const ids = lineasOC.map((l: any) => l.id)
    const { data: certificado, error: certError } = await supabase
      .from(TABLE_CERT_LINEAS)
      .select("linea_oc_id, cantidad, estado")
      .in("linea_oc_id", ids)
      .neq("estado", "rechazado")

    if (certError) throw certError

    const certificadoPorLinea = new Map<number, number>()
    for (const c of certificado || []) {
      certificadoPorLinea.set(
        c.linea_oc_id,
        (certificadoPorLinea.get(c.linea_oc_id) || 0) + Number(c.cantidad)
      )
    }

    return lineasOC.map((l: any) => {
      const cantidadCertificada = certificadoPorLinea.get(l.id) || 0
      return {
        id: l.id,
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        precio_unitario_neto: Number(l.precio_unitario_neto),
        iva_porcentaje: Number(l.iva_porcentaje),
        numero_oc: l.gu_ordenesdecompra?.numero_oc,
        orden_compra_id: l.gu_ordenesdecompra?.id,
        cantidad_certificada: cantidadCertificada,
        cantidad_disponible: Number(l.cantidad) - cantidadCertificada,
      }
    })
  }

  static async getByProyecto(proyectoId: number) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from(TABLE_CERT)
      .select(
        `
        *,
        gu_proveedores(nombre)
      `
      )
      .eq("proyecto_id", proyectoId)
      .order("fecha_cert", { ascending: false })

    if (error) throw error

    return (data || []).map((cert) => ({
      ...cert,
      proveedor_nombre: cert.gu_proveedores?.nombre,
    }))
  }
}
