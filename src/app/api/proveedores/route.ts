import { NextRequest, NextResponse } from "next/server"
import { ProveedorService } from "@/controllers"
import { AuditService } from "@/lib/audit/audit.service"

export async function GET() {
  try {
    const proveedores = await ProveedorService.getAll()
    return NextResponse.json(proveedores || [])
  } catch (error) {
    console.error("Error fetching proveedores:", error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const newProveedor = await ProveedorService.create(data)
    await AuditService.registrarDesdeRequest({
      tabla: "gu_proveedores",
      registroId: newProveedor.id,
      accion: "crear",
      detalle: `Proveedor ${newProveedor.nombre} creado`,
    })
    return NextResponse.json(newProveedor, { status: 201 })
  } catch (error) {
    console.error("Error creating proveedor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}


