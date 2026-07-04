import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"

// GET /api/certificaciones/lineas-oc-disponibles?proveedorId=N
// Líneas de OCs aprobadas del proveedor con su saldo certificable
export async function GET(request: NextRequest) {
  try {
    const proveedorId = request.nextUrl.searchParams.get("proveedorId")

    if (!proveedorId) {
      return NextResponse.json(
        { error: "proveedorId es requerido" },
        { status: 400 }
      )
    }

    const lineas = await CertificacionService.getLineasOCDisponibles(parseInt(proveedorId))
    return NextResponse.json(lineas || [])
  } catch (error) {
    console.error("Error fetching líneas de OC disponibles:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
