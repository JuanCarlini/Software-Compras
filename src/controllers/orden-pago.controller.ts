// src/controllers/orden-pago.service.ts
import { createClient } from "@/lib/supabase/client"

export class OrdenPagoService {
  // trae todas las OP
  static async getAll() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_ordenesdepago") // <-- tu nombre real
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  // trae una sola por id
  static async getById(id: number) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_ordenesdepago")
      .select("*")
      .eq("id", id)
      .single()

    if (error) return null
    return data
  }

  // crear
  static async create(payload: any) {
    const supabase = createClient()
    
    const { lineas, ...ordenData } = payload
    
    // Generar número automático OP-YYYY-NNN
    const { data: ultimaOP } = await supabase
      .from('gu_ordenesdepago')
      .select('numero_op')
      .order('id', { ascending: false })
      .limit(1)
      .single()
    
    let nuevoNumero = 'OP-2025-001'
    if (ultimaOP?.numero_op) {
      const match = ultimaOP.numero_op.match(/OP-(\d{4})-(\d{3})/)
      if (match) {
        const year = new Date().getFullYear()
        const lastYear = parseInt(match[1])
        const lastNum = parseInt(match[2])
        
        if (year === lastYear) {
          nuevoNumero = `OP-${year}-${(lastNum + 1).toString().padStart(3, '0')}`
        } else {
          nuevoNumero = `OP-${year}-001`
        }
      }
    }

    const { data: nuevaOP, error } = await supabase
      .from("gu_ordenesdepago")
      .insert({
        ...ordenData,
        numero_op: nuevoNumero
      })
      .select()
      .single()

    if (error) throw error

    // Insertar líneas de pago
    if (lineas && lineas.length > 0) {
      const lineasData = lineas.map((linea: any) => ({
        ...linea,
        orden_pago_id: nuevaOP.id
      }))
      
      const { error: lineasError } = await supabase
        .from('gu_lineasdeordenesdepago')
        .insert(lineasData)
      
      if (lineasError) throw lineasError
    }

    return nuevaOP
  }

  // update
  static async update(id: number, payload: any) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("gu_ordenesdepago")
      .update(payload)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // delete
  static async delete(id: number) {
    const supabase = createClient()
    const { error } = await supabase
      .from("gu_ordenesdepago")
      .delete()
      .eq("id", id)

    if (error) throw error
    return true
  }
}
