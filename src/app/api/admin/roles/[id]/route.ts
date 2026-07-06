import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/shared/permissions-server"
import { RolService } from "@/controllers/rol.controller"
import { AuditService } from "@/lib/audit/audit.service"

interface Params {
  params: Promise<{ id: string }>
}

// PUT /api/admin/roles/[id] - Editar rol (los del sistema no se renombran)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { error: authError, user } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    const actualizado = await RolService.update(Number(id), {
      nombre: body.nombre,
      descripcion: body.descripcion,
    })

    await AuditService.registrar({
      usuarioId: Number(user!.id),
      tabla: "gu_roles",
      registroId: Number(id),
      accion: "actualizar",
      detalle: `Rol #${id} actualizado`,
    })

    return NextResponse.json(actualizado)
  } catch (error: any) {
    const message = error?.message || "Error interno del servidor"
    const esNegocio = message.includes("sistema") || message.includes("no encontrado")
    return NextResponse.json({ error: message }, { status: esNegocio ? 400 : 500 })
  }
}

// DELETE /api/admin/roles/[id] - Eliminar rol (bloqueado si es del sistema o tiene usuarios)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError, user } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    await RolService.delete(Number(id))

    await AuditService.registrar({
      usuarioId: Number(user!.id),
      tabla: "gu_roles",
      registroId: Number(id),
      accion: "eliminar",
      detalle: `Rol #${id} eliminado`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const message = error?.message || "Error interno del servidor"
    const esNegocio = message.includes("sistema") || message.includes("usuario") || message.includes("no encontrado")
    return NextResponse.json({ error: message }, { status: esNegocio ? 400 : 500 })
  }
}
