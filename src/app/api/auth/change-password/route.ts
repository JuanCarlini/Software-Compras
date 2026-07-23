import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/permissions-server"
import { AuthService } from "@/lib/auth/auth.service"
import { AuditService } from "@/lib/audit/audit.service"
import { handleRouteError } from "@/lib/route/handle-route-error"

// POST /api/auth/change-password - El usuario autenticado cambia su propia clave
// (distinto del reset administrativo: acá se exige la clave actual)
export async function POST(request: NextRequest) {
  try {
    const { error: authError, user } = await requireAuth()
    if (authError) return authError

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "La contraseña actual y la nueva son requeridas" },
        { status: 400 }
      )
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const ok = await AuthService.changePassword(user!.id, oldPassword, newPassword)

    if (!ok) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 }
      )
    }

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_usuario",
      registroId: user!.id,
      accion: "actualizar",
      detalle: "Cambio de contraseña propio",
    })

    return NextResponse.json({ success: true, message: "Contraseña actualizada" })
  } catch (error) {
    return handleRouteError(error, "POST /api/auth/change-password")
  }
}
