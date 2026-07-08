import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { CreateFacturaSchema } from "@/shared/factura-validation"
import { AuditService } from "@/lib/audit/audit.service"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { handleRouteError } from "@/shared/handle-route-error"

// GET /api/facturas - Lista con el rollup de pago (v_factura_rollup)
export async function GET() {
  try {
    return NextResponse.json(await FacturaService.getAll())
  } catch (error) {
    return handleRouteError(error, "GET /api/facturas")
  }
}

// POST /api/facturas - Crear factura (líneas + imputaciones a certs aprobadas).
// 422 si una imputación viola fn_check_imputacion (cert no aprobada o Σ > total de líneas).
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const validatedData = CreateFacturaSchema.parse(await request.json())
    const nuevaFactura = await FacturaService.create(validatedData)

    await AuditService.registrarDesdeRequest({
      tabla: "gu_facturas",
      registroId: nuevaFactura.id,
      accion: "crear",
      detalle: `Factura ${nuevaFactura.numero_factura ?? nuevaFactura.id} creada`,
    })

    return NextResponse.json(nuevaFactura, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/facturas")
  }
}
