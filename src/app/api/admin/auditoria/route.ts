import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/shared/permissions-server"
import { isAdmin, stringToUserRole } from "@/shared/permissions"
import { AuditService } from "@/lib/audit/audit.service"
import { handleRouteError } from "@/shared/handle-route-error"

// GET /api/admin/auditoria — consulta de auditoría (solo admin), con búsqueda combinada.
// ?fuente=bitacora (gu_auditoria, operaciones con usuario) | cambios (gu_audit_log, historial de valores)
// Filtros comunes: usuarioId, tabla, accion, desde, hasta (YYYY-MM-DD).
// El I/O vive en AuditService.consultar (la ruta solo autoriza y parsea la query).
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
    const resultado = await AuditService.consultar({
      fuente: sp.get("fuente") === "cambios" ? "cambios" : "bitacora",
      usuarioId: sp.get("usuarioId"),
      tabla: sp.get("tabla"),
      accion: sp.get("accion"),
      desde: sp.get("desde"),
      hasta: sp.get("hasta"),
    })

    return NextResponse.json(resultado)
  } catch (error) {
    return handleRouteError(error, "GET /api/admin/auditoria")
  }
}
