import { createClient } from '../client'
import type { Database } from '../types'

type Proveedor = Database['public']['Tables']['proveedores']['Row']

export async function getProveedoresActivos() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('estado', 'Activo')
    .order('nombre')
  
  if (error) throw error
  return data
}

export async function getProveedorConOrdenes(id: string) {
  const supabase = createClient()
  
  const { data: proveedor, error: provError } = await supabase
    .from('proveedores')
    .select('*')
    .eq('id', id)
    .single()
  
  if (provError) throw provError
  
  const { data: ordenes } = await supabase
    .from('ordenes_compra')
    .select('*')
    .eq('proveedor_id', id)
    .order('created_at', { ascending: false })
  
  return { ...proveedor, ordenes: ordenes || [] }
}

export async function getEstadisticasProveedores() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('proveedores')
    .select('estado')
  
  if (error) throw error
  
  const activos = data.filter(p => p.estado === 'Activo').length
  const inactivos = data.filter(p => p.estado === 'Inactivo').length
  
  return { total: data.length, activos, inactivos }
}
