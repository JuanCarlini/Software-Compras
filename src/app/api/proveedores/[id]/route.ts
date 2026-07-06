import { NextRequest, NextResponse } from "next/server"
import { ProveedorService } from "@/controllers"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA, ROLES_DESTRUCTIVO } from "@/shared/permissions"
import { UpdateProveedorSchema } from "@/shared/proveedor-validation"
import { z } from "zod"

interface Params {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const proveedor = await ProveedorService.getById(Number(id))
    
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

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const data = UpdateProveedorSchema.parse(body) // S4: whitelist de campos
    const updatedProveedor = await ProveedorService.update(Number(id), data)

    if (!updatedProveedor) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedProveedor)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_DESTRUCTIVO)
    if (authError) return authError

    const { id } = await params
    const success = await ProveedorService.delete(Number(id))
    
    if (!success) {
      return NextResponse.json(
        { error: "Proveedor no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: "Proveedor eliminado correctamente" })
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
