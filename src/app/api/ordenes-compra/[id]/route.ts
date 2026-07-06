import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { UpdateOrdenCompraSchema, OrdenCompraParamsSchema } from "@/shared/orden-compra-validation"
import { requireAuth, requireRole } from "@/shared/permissions-server"
import { canAnularDocumento, stringToUserRole, ROLES_DESTRUCTIVO } from "@/shared/permissions"
import { UserRole } from "@/models"
import { AuditService } from "@/lib/audit/audit.service"

// GET /api/ordenes-compra/[id] - Obtener una orden específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = OrdenCompraParamsSchema.parse(resolvedParams)
    
    const orden = await OrdenCompraService.getById(Number(id))
    
    if (!orden) {
      return NextResponse.json(
        { error: "Orden de compra no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(orden)
  } catch (error) {
    console.error("Error al obtener orden:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/ordenes-compra/[id] - Actualizar una orden
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const { error: authError, user } = await requireAuth()
    if (authError) return authError

    const resolvedParams = await params
    const { id } = OrdenCompraParamsSchema.parse(resolvedParams)
    const body = await request.json()

    // Validar datos de entrada
    const validatedData = UpdateOrdenCompraSchema.parse(body)

    // Si se intenta anular, verificar permisos
    const userRole = stringToUserRole(user!.rol)
    if (validatedData.estado === "anulado" && !canAnularDocumento(userRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para anular órdenes de compra" },
        { status: 403 }
      )
    }

    // Actualizar la orden
    const ordenActualizada = await OrdenCompraService.update(Number(id), validatedData)

    if (!ordenActualizada) {
      return NextResponse.json(
        { error: "Orden de compra no encontrada" },
        { status: 404 }
      )
    }

    const accion = validatedData.estado === "aprobado" ? "aprobar"
      : validatedData.estado === "rechazado" ? "rechazar"
      : validatedData.estado === "anulado" ? "anular"
      : "actualizar"
    await AuditService.registrar({
      usuarioId: Number(user!.id),
      tabla: "gu_ordenesdecompra",
      registroId: Number(id),
      accion,
      detalle: `Orden de compra ${ordenActualizada.numero_oc ?? id}: ${accion}`,
    })

    return NextResponse.json(ordenActualizada)
  } catch (error) {
    console.error("Error al actualizar orden:", error)

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/ordenes-compra/[id] - Eliminar una orden
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireRole(ROLES_DESTRUCTIVO)
    if (authError) return authError

    const resolvedParams = await params
    const { id } = OrdenCompraParamsSchema.parse(resolvedParams)

    const eliminada = await OrdenCompraService.delete(Number(id))

    if (!eliminada) {
      return NextResponse.json(
        { error: "Orden de compra no encontrada" },
        { status: 404 }
      )
    }

    await AuditService.registrarDesdeRequest({
      tabla: "gu_ordenesdecompra",
      registroId: Number(id),
      accion: "eliminar",
      detalle: `Orden de compra #${id} eliminada`,
    })

    return NextResponse.json({ message: "Orden eliminada correctamente" })
  } catch (error) {
    console.error("Error al eliminar orden:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
