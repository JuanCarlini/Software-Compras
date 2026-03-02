import { NextRequest, NextResponse } from "next/server"
import { ProveedorService } from "@/controllers"
import { requireAuth } from "@/shared/permissions-server"
import { canModificarProveedor, stringToUserRole } from "@/shared/permissions"
import { UserRole } from "@/models"

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
        { error: "No tienes permisos para activar proveedores" },
        { status: 403 }
      )
    }

    const { id } = await params
    const proveedor = await ProveedorService.update(id, { estado: 'Activo' })

    if (!proveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(proveedor)
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
