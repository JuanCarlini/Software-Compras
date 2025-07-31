import { NextRequest, NextResponse } from "next/server"
import { ProveedorController } from "@/controllers"

export async function GET() {
  try {
    const proveedores = await ProveedorController.getAll()
    return NextResponse.json(proveedores)
  } catch (error) {
    console.error("Error fetching proveedores:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const newProveedor = await ProveedorController.create(data)
    return NextResponse.json(newProveedor, { status: 201 })
  } catch (error) {
    console.error("Error creating proveedor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
