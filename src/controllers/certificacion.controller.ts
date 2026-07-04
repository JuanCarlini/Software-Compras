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
      .select("*")
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
    
    let nuevoNumero = 'CERT-2025-001'
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

      if (lineasError) throw lineasError
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
