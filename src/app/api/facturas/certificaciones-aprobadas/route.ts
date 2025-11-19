import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const proveedorId = searchParams.get('proveedorId')
    
    if (!proveedorId) {
      return NextResponse.json(
        { error: "proveedorId es requerido" },
        { status: 400 }
      )
    }
    
    const certificaciones = await FacturaService.getCertificacionesAprobadas(parseInt(proveedorId))
    return NextResponse.json(certificaciones || [])
  } catch (error) {
    console.error("Error fetching certificaciones aprobadas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
