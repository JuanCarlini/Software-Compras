import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"

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
    const { id } = await params
    const data = await request.json()
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
