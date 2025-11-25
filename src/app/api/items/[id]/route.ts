import { NextRequest, NextResponse } from "next/server"
import { ItemService } from "@/controllers"
import { UpdateItemSchema } from "@/shared/item-validation"
import { z } from "zod"

interface Params {
  params: {
    id: string
  }
}

// GET /api/items/[id] - Obtener un item por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const itemId = parseInt(params.id)
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const item = await ItemService.getById(itemId)
    
    if (!item) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(item)
  } catch (error) {
    console.error("Error al obtener item:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/items/[id] - Actualizar un item
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const itemId = parseInt(params.id)
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = UpdateItemSchema.parse(body)
    
    const itemActualizado = await ItemService.update(itemId, validatedData)
    
    if (!itemActualizado) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(itemActualizado)
  } catch (error) {
    console.error("Error al actualizar item:", error)
    
    // Si es error de validación de Zod
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

// DELETE /api/items/[id] - Soft delete de un item
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const itemId = parseInt(params.id)
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      )
    }

    // Verificar si el item está en uso
    const enUso = await ItemService.isInUse(itemId)
    
    if (enUso) {
      return NextResponse.json(
        { 
          error: "No se puede eliminar el item porque está siendo utilizado en órdenes de compra",
          suggestion: "Puedes marcarlo como inactivo en su lugar"
        },
        { status: 409 } // Conflict
      )
    }

    const success = await ItemService.softDelete(itemId)
    
    if (!success) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: "Item marcado como inactivo correctamente" 
    })
  } catch (error) {
    console.error("Error al eliminar item:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
