import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"

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
    return NextResponse.json(nuevaCert, { status: 201 })
  } catch (error) {
    console.error("Error creating certificacion:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
