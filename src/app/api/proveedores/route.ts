import { NextRequest, NextResponse } from "next/server"
import { ProveedorService } from "@/controllers"
import { AuditService } from "@/lib/audit/audit.service"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { CreateProveedorSchema } from "@/shared/proveedor-validation"
import { z } from "zod"

export async function GET() {
  try {
    const proveedores = await ProveedorService.getAll()
    return NextResponse.json(proveedores || [])
  } catch (error) {
    console.error("Error fetching proveedores:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const body = await request.json()
    const data = CreateProveedorSchema.parse(body) // S4: whitelist de campos
    const newProveedor = await ProveedorService.create(data)
    await AuditService.registrarDesdeRequest({
      tabla: "gu_proveedores",
      registroId: newProveedor.id,
      accion: "crear",
      detalle: `Proveedor ${newProveedor.nombre} creado`,
    })
    return NextResponse.json(newProveedor, { status: 201 })
  } catch (error) {
    console.error("Error creating proveedor:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}


