import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"

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
    const data = await request.json()
    const nuevaFactura = await FacturaService.create(data)
    return NextResponse.json(nuevaFactura, { status: 201 })
  } catch (error) {
    console.error("Error creating factura:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
