import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { requireAuth, requireRole } from "@/shared/permissions-server"
import { canAnularDocumento, stringToUserRole, ROLES_DESTRUCTIVO } from "@/shared/permissions"
import { UserRole } from "@/models"
import { AuditService } from "@/lib/audit/audit.service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const factura = await FacturaService.getById(parseInt(id))
    
    if (!factura) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(factura)
  } catch (error) {
    console.error("Error fetching factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

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

    // Si se intenta anular, verificar permisos
    const userRole = stringToUserRole(user!.rol)
    if (data.estado === "anulado" && !canAnularDocumento(userRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para anular facturas" },
        { status: 403 }
      )
    }

    const factura = await FacturaService.update(parseInt(id), data)

    if (!factura) {
      return NextResponse.json(
        { error: "Error al actualizar factura" },
        { status: 400 }
      )
    }

    const accion = data.estado === "aprobado" ? "aprobar"
      : data.estado === "rechazado" ? "rechazar"
      : data.estado === "anulado" ? "anular"
      : "actualizar"
    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_facturas",
      registroId: parseInt(id),
      accion,
      detalle: `Factura ${factura.numero_factura ?? id}: ${accion}`,
    })

    return NextResponse.json(factura)
  } catch (error) {
    console.error("Error updating factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireRole(ROLES_DESTRUCTIVO)
    if (authError) return authError

    const { id } = await params
    const success = await FacturaService.delete(parseInt(id))
    
    if (!success) {
      return NextResponse.json(
        { error: "Error al eliminar factura" },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
