import { NextRequest, NextResponse } from "next/server"
import { ProveedorController } from "@/controllers"

interface Params {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const proveedor = await ProveedorController.getById(params.id)
    
    if (!proveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error fetching proveedor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const data = await request.json()
    const updatedProveedor = await ProveedorController.update(params.id, data)
    
    if (!updatedProveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updatedProveedor)
  } catch (error) {
    console.error("Error updating proveedor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const success = await ProveedorController.delete(params.id)
    
    if (!success) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: "Proveedor eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting proveedor:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
