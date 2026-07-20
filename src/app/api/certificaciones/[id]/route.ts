import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"
import { UpdateCertificacionSchema } from "@/shared/certificacion-validation"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_DESTRUCTIVO, ROLES_ESCRITURA } from "@/shared/permissions"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { AuditService } from "@/lib/audit/audit.service"

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/certificaciones/[id] - Cabecera + líneas derivadas + rollup de facturación
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseId((await params).id)

    const cert = await CertificacionService.getById(id)
    if (!cert) {
      return NextResponse.json({ error: "Certificación no encontrada" }, { status: 404 })
    }

    return NextResponse.json(cert)
  } catch (error) {
    return handleRouteError(error, "GET /api/certificaciones/[id]")
  }
}

// PUT /api/certificaciones/[id] - Editar la cabecera (el estado va por PATCH /estado)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { error: authError, user } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const id = parseId((await params).id)
    const validatedData = UpdateCertificacionSchema.parse(await request.json())

    const cert = await CertificacionService.update(id, validatedData)
    if (!cert) {
      return NextResponse.json({ error: "Certificación no encontrada" }, { status: 404 })
    }

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_certificaciones",
      registroId: id,
      accion: "actualizar",
      detalle: `Certificación ${cert.numero_cert ?? id}: actualizar`,
    })

    return NextResponse.json(cert)
  } catch (error) {
    return handleRouteError(error, "PUT /api/certificaciones/[id]")
  }
}

// DELETE /api/certificaciones/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_DESTRUCTIVO)
    if (authError) return authError

    const id = parseId((await params).id)

    const success = await CertificacionService.delete(id)
    if (!success) {
      return NextResponse.json({ error: "Certificación no encontrada" }, { status: 404 })
    }

    await AuditService.registrarDesdeRequest({
      tabla: "gu_certificaciones",
      registroId: id,
      accion: "eliminar",
      detalle: `Certificación #${id} eliminada`,
    })

    return NextResponse.json({ message: "Certificación eliminada correctamente" })
  } catch (error) {
    return handleRouteError(error, "DELETE /api/certificaciones/[id]")
  }
}
