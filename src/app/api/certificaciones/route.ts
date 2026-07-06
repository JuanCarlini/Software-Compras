import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"
import { AuditService } from "@/lib/audit/audit.service"

export async function GET() {
  try {
    const certificaciones = await CertificacionService.getAll()
    return NextResponse.json(certificaciones)
  } catch (error) {
    console.error("Error fetching certificaciones:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const nuevaCert = await CertificacionService.create(data)
    await AuditService.registrarDesdeRequest({
      tabla: "gu_certificaciones",
      registroId: nuevaCert.id,
      accion: "crear",
      detalle: `Certificación ${nuevaCert.numero_cert} creada`,
    })
    return NextResponse.json(nuevaCert, { status: 201 })
  } catch (error: any) {
    console.error("Error creating certificacion:", error)
    // El trigger de la DB (regla del 100%) lanza mensajes en español aptos para el usuario
    const message: string = error?.message || ""
    if (message.includes("100%")) {
      return NextResponse.json({ error: message }, { status: 422 })
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
