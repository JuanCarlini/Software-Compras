import { NextRequest, NextResponse } from "next/server"
import { ItemService } from "@/controllers"
import { UpdateItemSchema } from "@/shared/item-validation"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/items/[id] - Obtener un item por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const itemId = parseId((await params).id)

    const item = await ItemService.getById(itemId)
    if (!item) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    return handleRouteError(error, "GET /api/items/[id]")
  }
}

// PUT /api/items/[id] - Actualizar un item
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const itemId = parseId((await params).id)
    const validatedData = UpdateItemSchema.parse(await request.json())

    const itemActualizado = await ItemService.update(itemId, validatedData)
    if (!itemActualizado) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    }

    return NextResponse.json(itemActualizado)
  } catch (error) {
    return handleRouteError(error, "PUT /api/items/[id]")
  }
}

// DELETE /api/items/[id] - Soft delete de un item
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const itemId = parseId((await params).id)

    // Un item usado en alguna OC no se borra: se marca inactivo
    if (await ItemService.isInUse(itemId)) {
      return NextResponse.json(
        {
          error: "No se puede eliminar el item porque está siendo utilizado en órdenes de compra",
          suggestion: "Puedes marcarlo como inactivo en su lugar",
        },
        { status: 409 }
      )
    }

    const success = await ItemService.softDelete(itemId)
    if (!success) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item marcado como inactivo correctamente" })
  } catch (error) {
    return handleRouteError(error, "DELETE /api/items/[id]")
  }
}
