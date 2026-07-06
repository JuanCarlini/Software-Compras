import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { AuditService } from "@/lib/audit/audit.service"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { CreateFacturaSchema } from "@/shared/factura-validation"
import { z } from "zod"

export async function GET() {
  try {
    const facturas = await FacturaService.getAll()
    return NextResponse.json(facturas || [])
  } catch (error) {
    console.error("Error fetching facturas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const body = await request.json()
    const data = CreateFacturaSchema.parse(body) // S4: whitelist de campos; 'estado' se descarta (S2)
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
