import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"
import { requireAuth } from "@/shared/permissions-server"
import { canAnularDocumento, stringToUserRole } from "@/shared/permissions"
import { UserRole } from "@/models"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cert = await CertificacionService.getById(parseInt(id))
    
    if (!cert) {
      return NextResponse.json(
        { error: "Certificación no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(cert)
  } catch (error) {
    console.error("Error fetching certificacion:", error)
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

    // Si se intenta cambiar a estado rechazado o aprobado, verificar permisos
    const userRole = stringToUserRole(user!.rol)
    if ((data.estado === "rechazado" || data.estado === "aprobado") && !canAnularDocumento(userRole)) {
      return NextResponse.json(
        { error: "No tienes permisos para aprobar o rechazar certificaciones" },
        { status: 403 }
      )
    }

    const cert = await CertificacionService.update(parseInt(id), data)

    if (!cert) {
      return NextResponse.json(
        { error: "Error al actualizar certificación" },
        { status: 400 }
      )
    }

    return NextResponse.json(cert)
  } catch (error) {
    console.error("Error updating certificacion:", error)
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
    const { id } = await params
    const success = await CertificacionService.delete(parseInt(id))
    
    if (!success) {
      return NextResponse.json(
        { error: "Error al eliminar certificación" },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting certificacion:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
