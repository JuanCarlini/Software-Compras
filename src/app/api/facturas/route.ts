import { NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { CreateFacturaSchema } from "@/shared/factura-validation"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { handleRouteError } from "@/shared/handle-route-error"
import { createRoute } from "@/shared/crud-route"

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
export const POST = createRoute({
  autorizar: () => requireRole(ROLES_ESCRITURA),
  schema: CreateFacturaSchema,
  crear: (data) => FacturaService.create(data),
  audit: {
    tabla: "gu_facturas",
    detalle: (f) => `Factura ${f.numero_factura ?? f.id} creada`,
  },
  contexto: "POST /api/facturas",
})
