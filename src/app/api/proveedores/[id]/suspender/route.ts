import { NextRequest, NextResponse } from "next/server"
import { ProveedorController } from "@/controllers"

interface Params {
  params: {
    id: string
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const proveedor = await ProveedorController.suspender(params.id)
    
    if (!proveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error suspending proveedor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
