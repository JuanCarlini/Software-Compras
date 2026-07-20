import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"
import { CreateCertificacionSchema } from "@/shared/certificacion-validation"
import { AuditService } from "@/lib/audit/audit.service"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { handleRouteError } from "@/shared/handle-route-error"

// GET /api/certificaciones - Lista con el rollup de facturación (v_cert_rollup)
export async function GET() {
  try {
    return NextResponse.json(await CertificacionService.getAll())
  } catch (error) {
    return handleRouteError(error, "GET /api/certificaciones")
  }
}

// POST /api/certificaciones - Certificar contra UNA orden de compra aprobada.
// Las líneas solo llevan { linea_oc_id, avance_unidades }.
// 422 si la OC no está aprobada o si el trigger del 100% rechaza el avance.
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const validatedData = CreateCertificacionSchema.parse(await request.json())
    const nuevaCert = await CertificacionService.create(validatedData)

    await AuditService.registrarDesdeRequest({
      tabla: "gu_certificaciones",
      registroId: nuevaCert.id,
      accion: "crear",
      detalle: `Certificación ${nuevaCert.numero_cert} creada`,
    })

    return NextResponse.json(nuevaCert, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/certificaciones")
  }
}
