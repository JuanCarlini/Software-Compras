import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/shared/permissions-server"
import { RolService } from "@/controllers/rol.controller"
import { AuditService } from "@/lib/audit/audit.service"

// GET /api/admin/roles - Catálogo de roles con cantidad de usuarios (solo admin)
export async function GET() {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const roles = await RolService.getAll()
    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error en GET /api/admin/roles:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST /api/admin/roles - Crear rol
export async function POST(request: NextRequest) {
  try {
    const { error: authError, user } = await requireAdmin()
    if (authError) return authError

    const { nombre, descripcion } = await request.json()
    if (!nombre?.trim()) {
      return NextResponse.json({ error: "El nombre del rol es requerido" }, { status: 400 })
    }

    const nuevo = await RolService.create({ nombre, descripcion })

    await AuditService.registrar({
      usuarioId: Number(user!.id),
      tabla: "gu_roles",
      registroId: nuevo.id,
      accion: "crear",
      detalle: `Rol "${nuevo.nombre}" creado`,
    })

    return NextResponse.json(nuevo, { status: 201 })
  } catch (error: any) {
    console.error("Error en POST /api/admin/roles:", error)
    const message = error?.message || "Error interno del servidor"
    return NextResponse.json({ error: message }, { status: message.includes("Ya existe") ? 409 : 500 })
  }
}
