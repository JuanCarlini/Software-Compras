import { createClient } from "@/lib/supabase/service"
import type { FiltrosReporte } from "@/shared/validation/reporte.schema"

// Los RPC hacen toda la agregacion: aca solo se traducen los filtros a parametros.
// No usa createBaseRepository porque no es CRUD sobre una tabla.
function parametros(f: FiltrosReporte) {
  return {
    p_desde: f.desde,
    p_hasta: f.hasta,
    p_proveedor_id: f.proveedorId,
    p_proyecto_id: f.proyectoId,
    p_moneda: f.moneda,
  }
}

async function invocar<T>(fn: string, f: FiltrosReporte): Promise<T[]> {
  const supabase = createClient() as unknown as {
    rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: T[] | null; error: unknown }>
  }
  const { data, error } = await supabase.rpc(fn, parametros(f))
  if (error) throw error
  return data ?? []
}

export const ReporteRepository = {
  circuito: <T>(f: FiltrosReporte) => invocar<T>("rpc_reporte_circuito", f),
  circuitoMensual: <T>(f: FiltrosReporte) => invocar<T>("rpc_reporte_circuito_mensual", f),
  pendienteCertificar: <T>(f: FiltrosReporte) => invocar<T>("rpc_reporte_pendiente_certificar", f),
  deuda: <T>(f: FiltrosReporte) => invocar<T>("rpc_reporte_deuda", f),
  proveedores: <T>(f: FiltrosReporte) => invocar<T>("rpc_reporte_proveedores", f),
  proyectos: <T>(f: FiltrosReporte) => invocar<T>("rpc_reporte_proyectos", f),
}
