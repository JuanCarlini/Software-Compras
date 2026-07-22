import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/shared/permissions-server"
import { UsuarioService } from "@/controllers/usuario.controller"
import { AuditService } from "@/lib/audit/audit.service"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"

interface Params {
  params: Promise<{ id: string }>
}

// PUT /api/admin/users/[id] - Editar usuario (nombre, email, rol, estado)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { error: authError, user } = await requireAdmin()
    if (authError) return authError

    const userId = parseId((await params).id)
    const body = await request.json()

    // Evitar auto-lockout: un admin no puede desactivarse ni quitarse el rol a sí mismo
    const esUnoMismo = user!.id === userId
    if (esUnoMismo && (body.estado === "inactivo" || (body.rol_id && Number(body.rol_id) !== 1))) {
      return NextResponse.json(
        { error: "No podés desactivarte ni quitarte el rol de administrador a vos mismo" },
        { status: 400 }
      )
    }

    const actualizado = await UsuarioService.update(userId, {
      nombre: body.nombre,
      email: body.email,
      rol_id: body.rol_id !== undefined ? Number(body.rol_id) : undefined,
      estado: body.estado,
    })

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_usuario",
      registroId: userId,
      accion: "actualizar",
      detalle: `Usuario #${userId} actualizado por admin`,
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    return handleRouteError(error, "PUT /api/admin/users/[id]")
  }
}

// DELETE /api/admin/users/[id] - Baja lógica (estado = inactivo; el login la excluye)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError, user } = await requireAdmin()
    if (authError) return authError

    const userId = parseId((await params).id)

    if (user!.id === userId) {
      return NextResponse.json(
        { error: "No podés darte de baja a vos mismo" },
        { status: 400 }
      )
    }

    await UsuarioService.update(userId, { estado: "inactivo" })

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_usuario",
      registroId: userId,
      accion: "eliminar",
      detalle: `Usuario #${userId} dado de baja (lógica) por admin`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, "DELETE /api/admin/users/[id]")
  }
}
