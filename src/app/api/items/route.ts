import { NextRequest, NextResponse } from "next/server"
import { ItemService } from "@/controllers"
import { CreateItemSchema } from "@/shared/item-validation"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { handleRouteError } from "@/shared/handle-route-error"
import { createRoute } from "@/shared/crud-route"

// GET /api/items - Obtener todos los items activos
// Query params opcionales: ?includeInactive=true, ?categoria=string
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"
    const categoria = searchParams.get("categoria")

    let items

    if (categoria) {
      items = await ItemService.getByCategoria(categoria)
    } else if (includeInactive) {
      items = await ItemService.getAllIncludingInactive()
    } else {
      items = await ItemService.getAll()
    }

    return NextResponse.json(items || [])
  } catch (error) {
    return handleRouteError(error, "GET /api/items")
  }
}

// POST /api/items - Crear nuevo item (created_by lo pone el server desde el JWT)
export const POST = createRoute({
  autorizar: () => requireRole(ROLES_ESCRITURA),
  schema: CreateItemSchema,
  crear: (data, user) => ItemService.create(data, user.id),
  contexto: "POST /api/items",
})
