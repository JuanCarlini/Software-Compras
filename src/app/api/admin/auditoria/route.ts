import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/shared/permissions-server"
import { isAdmin, stringToUserRole } from "@/shared/permissions"
import { createClient } from "@/lib/supabase/service"

// Valores del enum audit_accion (columna gu_audit_log.accion). La bitácora
// (gu_auditoria.accion) es texto libre y acepta cualquier filtro.
const ACCIONES_CAMBIO = ["crear", "actualizar", "eliminar"] as const
type AccionCambio = (typeof ACCIONES_CAMBIO)[number]

// GET /api/admin/auditoria — consulta de auditoría (solo admin), con búsqueda combinada.
// ?fuente=bitacora (gu_auditoria, operaciones con usuario) | cambios (gu_audit_log, historial de valores)
// Filtros comunes: usuarioId, tabla, accion, desde, hasta (YYYY-MM-DD)
export async function GET(request: NextRequest) {
  try {
    const { error: authError, user } = await requireAuth()
    if (authError) return authError
    if (!isAdmin(stringToUserRole(user!.rol))) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a la auditoría" },
        { status: 403 }
      )
    }

    const sp = request.nextUrl.searchParams
    const fuente = sp.get("fuente") === "cambios" ? "cambios" : "bitacora"
    const usuarioId = sp.get("usuarioId")
    const tabla = sp.get("tabla")
    const accion = sp.get("accion")
    const desde = sp.get("desde")
    const hasta = sp.get("hasta")

    const supabase = await createClient()

    if (fuente === "cambios") {
      // El filtro se compara contra un enum de Postgres: un valor fuera del enum
      // reventaba la query. Antes 400 que un 500 silencioso.
      if (accion && !(ACCIONES_CAMBIO as readonly string[]).includes(accion)) {
        return NextResponse.json(
          { error: `Acción inválida para el control de cambios. Válidas: ${ACCIONES_CAMBIO.join(", ")}` },
          { status: 400 }
        )
      }

      // Control de cambios: gu_audit_log (historial con valores anteriores/nuevos)
      let q = supabase
        .from("gu_audit_log")
        .select("id, tabla_afectada, registro_id, usuario_id, accion, datos_anteriores, datos_nuevos, created_at, gu_usuario(nombre, email)")
        .order("created_at", { ascending: false })
        .limit(500)

      if (usuarioId) q = q.eq("usuario_id", Number(usuarioId))
      if (tabla) q = q.eq("tabla_afectada", tabla)
      if (accion) q = q.eq("accion", accion as AccionCambio)
      if (desde) q = q.gte("created_at", `${desde}T00:00:00`)
      if (hasta) q = q.lte("created_at", `${hasta}T23:59:59`)

      const { data, error } = await q
      if (error) throw error
      return NextResponse.json(
        (data || []).map((r: any) => ({
          id: r.id,
          tabla: r.tabla_afectada,
          registro_id: r.registro_id,
          usuario: r.gu_usuario?.nombre ?? (r.usuario_id ? `#${r.usuario_id}` : "sistema/directo"),
          accion: r.accion,
          datos_anteriores: r.datos_anteriores,
          datos_nuevos: r.datos_nuevos,
          fecha: r.created_at,
        }))
      )
    }

    // Bitácora de operaciones: gu_auditoria (con usuario)
    let q = supabase
      .from("gu_auditoria")
      .select("id, tabla_origen, registro_id, usuario_id, accion, motivo_cambio, fecha_cambio, gu_usuario(nombre, email)")
      .order("fecha_cambio", { ascending: false })
      .limit(500)

    if (usuarioId) q = q.eq("usuario_id", Number(usuarioId))
    if (tabla) q = q.eq("tabla_origen", tabla)
    if (accion) q = q.eq("accion", accion)
    if (desde) q = q.gte("fecha_cambio", `${desde}T00:00:00`)
    if (hasta) q = q.lte("fecha_cambio", `${hasta}T23:59:59`)

    const { data, error } = await q
    if (error) throw error
    return NextResponse.json(
      (data || []).map((r: any) => ({
        id: r.id,
        tabla: r.tabla_origen,
        registro_id: r.registro_id,
        usuario: r.gu_usuario?.nombre ?? `#${r.usuario_id}`,
        accion: r.accion,
        detalle: r.motivo_cambio,
        fecha: r.fecha_cambio,
      }))
    )
  } catch (error) {
    console.error("Error en GET /api/admin/auditoria:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
