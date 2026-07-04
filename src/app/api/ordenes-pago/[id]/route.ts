import { NextRequest, NextResponse } from "next/server"
import { OrdenPagoService } from "@/controllers"
import { requireAuth } from "@/shared/permissions-server"
import { canAnularDocumento, stringToUserRole } from "@/shared/permissions"
import { UserRole } from "@/models"

// GET /api/ordenes-pago/[id] - Obtener una orden de pago específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orden = await OrdenPagoService.getById(parseInt(id))

    if (!orden) {
      return NextResponse.json(
        { error: "Orden de pago no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error("Error al obtener orden de pago:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/ordenes-pago/[id] - Actualizar una orden de pago
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const { error: authError, user } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const data = await request.json()

    // Si se intenta aprobar, rechazar o pagar, verificar permisos
    const userRole = stringToUserRole(user!.rol)
    if ((data.estado === "rechazado" || data.estado === "aprobado" || data.estado === "pagado") && !canAnularDocumento(userRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para aprobar, rechazar o marcar como pagadas las órdenes de pago" },
        { status: 403 }
      )
    }

    const orden = await OrdenPagoService.update(parseInt(id), data)

    if (!orden) {
      return NextResponse.json(
        { error: "Error al actualizar orden de pago" },
        { status: 400 }
      )
    }

    return NextResponse.json(orden)
  } catch (error) {
    console.error("Error al actualizar orden de pago:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/ordenes-pago/[id] - Eliminar una orden de pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const success = await OrdenPagoService.delete(parseInt(id))

    if (!success) {
      return NextResponse.json(
        { error: "Error al eliminar orden de pago" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar orden de pago:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
