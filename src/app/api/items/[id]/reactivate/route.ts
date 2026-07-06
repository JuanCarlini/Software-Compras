import { NextRequest, NextResponse } from "next/server"
import { ItemService } from "@/controllers"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"

interface Params {
  params: Promise<{
    id: string
  }>
}

// POST /api/items/[id]/reactivate - Reactivar un item inactivo
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const { id } = await params
    const itemId = parseInt(id)
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const success = await ItemService.reactivate(itemId)
    
    if (!success) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: "Item reactivado correctamente" 
    })
  } catch (error) {
    console.error("Error al reactivar item:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
