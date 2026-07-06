import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { AuditService } from "@/lib/audit/audit.service"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"

export async function GET() {
  try {
    const facturas = await FacturaService.getAll()
    return NextResponse.json(facturas || [])
  } catch (error) {
    console.error("Error fetching facturas:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const data = await request.json()
    const nuevaFactura = await FacturaService.create(data)
    await AuditService.registrarDesdeRequest({
      tabla: "gu_facturas",
      registroId: nuevaFactura.id,
      accion: "crear",
      detalle: `Factura ${nuevaFactura.numero_factura ?? nuevaFactura.id} creada`,
    })
    return NextResponse.json(nuevaFactura, { status: 201 })
  } catch (error) {
    console.error("Error creating factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
