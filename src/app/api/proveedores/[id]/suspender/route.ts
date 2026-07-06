import { NextRequest, NextResponse } from "next/server"
import { ProveedorService } from "@/controllers"
import { requireAuth } from "@/shared/permissions-server"
import { canModificarProveedor, stringToUserRole } from "@/shared/permissions"
import { UserRole, EstadoProveedor } from "@/models"
import { AuditService } from "@/lib/audit/audit.service"

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Verificar autenticación
    const { error: authError, user } = await requireAuth()
    if (authError) return authError

    // Verificar permisos para modificar proveedores
    const userRole = stringToUserRole(user!.rol)
    if (!canModificarProveedor(userRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para suspender proveedores" },
        { status: 403 }
      )
    }

    const { id } = await params
    // La DB solo tiene activo/inactivo: "suspender" se materializa como inactivo
    const proveedor = await ProveedorService.update(Number(id), { estado: EstadoProveedor.INACTIVO })

    if (!proveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }

    await AuditService.registrar({
      usuarioId: Number(user!.id),
      tabla: "gu_proveedores",
      registroId: Number(id),
      accion: "suspender",
      detalle: `Proveedor ${proveedor.nombre ?? id} suspendido (inactivo)`,
    })

    return NextResponse.json(proveedor)
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
