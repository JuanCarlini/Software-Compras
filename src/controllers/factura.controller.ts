import { createClient } from '@/lib/supabase/client'

export class FacturaService {
  static async getAll() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gu_facturas')
      .select(`
        *,
        gu_proveedores(nombre, cuit)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(factura => ({
      ...factura,
      proveedor_nombre: factura.gu_proveedores?.nombre,
      proveedor_cuit: factura.gu_proveedores?.cuit
    }))
  }

  static async getById(id: number) {
    const supabase = createClient()
    
    const { data: factura, error } = await supabase
      .from('gu_facturas')
      .select(`
        *,
        gu_proveedores(nombre, cuit, email, direccion)
      `)
      .eq('id', id)
      .single()
    
    if (error || !factura) return null
    
    // Obtener líneas de la factura
    const { data: lineas } = await supabase
      .from('gu_lineasdefactura')
      .select('*')
      .eq('factura_id', id)

    // Obtener certificaciones asociadas
    const { data: certificaciones } = await supabase
      .from('gu_facturas_certificaciones')
      .select(`
        certificacion_id,
        gu_certificaciones(
          id,
          numero_cert,
          fecha_cert,
          total_neto,
          total_con_iva,
          estado
        )
      `)
      .eq('factura_id', id)
    
    return {
      ...factura,
      proveedor_nombre: factura.gu_proveedores?.nombre,
      proveedor_cuit: factura.gu_proveedores?.cuit,
      proveedor_email: factura.gu_proveedores?.email,
      proveedor_direccion: factura.gu_proveedores?.direccion,
      lineas: lineas || [],
      certificaciones: (certificaciones || []).map(c => c.gu_certificaciones)
    }
  }

  static async getCertificacionesAprobadas(proveedorId: number) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gu_certificaciones')
      .select('*')
      .eq('proveedor_id', proveedorId)
      .eq('estado', 'aprobado')
      .order('fecha_cert', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async create(data: any) {
    const supabase = createClient()
    
    const { lineas, certificaciones_ids, ...facturaData } = data
    
    // Generar número automático FACT-YYYY-NNN
    const { data: ultimaFactura } = await supabase
      .from('gu_facturas')
      .select('numero_factura')
      .order('id', { ascending: false })
      .limit(1)
      .single()
    
    let nuevoNumero = 'FACT-2025-001'
    if (ultimaFactura?.numero_factura) {
      const match = ultimaFactura.numero_factura.match(/FACT-(\d{4})-(\d{3})/)
      if (match) {
        const year = new Date().getFullYear()
        const lastYear = parseInt(match[1])
        const lastNum = parseInt(match[2])
        
        if (year === lastYear) {
          nuevoNumero = `FACT-${year}-${(lastNum + 1).toString().padStart(3, '0')}`
        } else {
          nuevoNumero = `FACT-${year}-001`
        }
      }
    }

    const { data: nuevaFactura, error: facturaError } = await supabase
      .from('gu_facturas')
      .insert({
        ...facturaData,
        numero_factura: nuevoNumero
      })
      .select()
      .single()
    
    if (facturaError) throw facturaError
    
    // Insertar líneas de factura
    if (lineas && lineas.length > 0) {
      const lineasData = lineas.map((linea: any) => ({
        ...linea,
        factura_id: nuevaFactura.id
      }))
      
      const { error: lineasError } = await supabase
        .from('gu_lineasdefactura')
        .insert(lineasData)
      
      if (lineasError) throw lineasError
    }

    // Asociar certificaciones
    if (certificaciones_ids && certificaciones_ids.length > 0) {
      const relacionesData = certificaciones_ids.map((certId: number) => ({
        factura_id: nuevaFactura.id,
        certificacion_id: certId
      }))
      
      const { error: relacionesError } = await supabase
        .from('gu_facturas_certificaciones')
        .insert(relacionesData)
      
      if (relacionesError) throw relacionesError
    }
    
    return nuevaFactura
  }

  static async update(id: number, data: any) {
    const supabase = createClient()
    
    const { certificaciones_ids, ...facturaData } = data

    const { data: facturaActualizada, error } = await supabase
      .from('gu_facturas')
      .update(facturaData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) return null

    // Actualizar certificaciones asociadas si se proporcionaron
    if (certificaciones_ids !== undefined) {
      // Eliminar relaciones anteriores
      await supabase
        .from('gu_facturas_certificaciones')
        .delete()
        .eq('factura_id', id)

      // Insertar nuevas relaciones
      if (certificaciones_ids.length > 0) {
        const relacionesData = certificaciones_ids.map((certId: number) => ({
          factura_id: id,
          certificacion_id: certId
        }))
        
        await supabase
          .from('gu_facturas_certificaciones')
          .insert(relacionesData)
      }
    }

    return facturaActualizada
  }

  static async delete(id: number) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('gu_facturas')
      .delete()
      .eq('id', id)
    
    return !error
  }
}
