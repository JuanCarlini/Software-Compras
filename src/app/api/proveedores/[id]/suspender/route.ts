import { NextRequest, NextResponse } from "next/server"
import { ProveedorService } from "@/controllers"

interface Params {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const proveedor = await ProveedorService.update(params.id, { estado: 'Suspendido' })
    
    if (!proveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(proveedor)
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
