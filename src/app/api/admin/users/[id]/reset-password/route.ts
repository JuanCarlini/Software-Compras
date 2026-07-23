import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/permissions-server"
import { UsuarioService } from "@/controllers/usuario.controller"
import { AuditService } from "@/lib/audit/audit.service"
import { parseId } from "@/lib/route/parse-id"
import { handleRouteError } from "@/lib/route/handle-route-error"

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/admin/users/[id]/reset-password - Reset administrativo de clave.
// También es el mecanismo de "recuperar clave": sin servicio de email, el usuario
// que no puede entrar contacta al admin y este le asigna una clave nueva.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { error: authError, user } = await requireAdmin()
    if (authError) return authError

    const userId = parseId((await params).id)
    const { password } = await request.json()

    if (!password || String(password).length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    await UsuarioService.resetPassword(userId, password)

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_usuario",
      registroId: userId,
      accion: "resetear",
      detalle: `Clave del usuario #${userId} reseteada por admin`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, "POST /api/admin/users/[id]/reset-password")
  }
}
