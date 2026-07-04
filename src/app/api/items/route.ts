import { NextRequest, NextResponse } from "next/server"
import { ItemService } from "@/controllers"
import { CreateItemSchema } from "@/shared/item-validation"
import { z } from "zod"

// GET /api/items - Obtener todos los items activos
// Query params opcionales: ?includeInactive=true, ?categoria=string
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get("includeInactive") === "true"
    const categoria = searchParams.get("categoria")

    let items

    if (categoria) {
      // Filtrar por categoría
      items = await ItemService.getByCategoria(categoria)
    } else if (includeInactive) {
      // Incluir items inactivos
      items = await ItemService.getAllIncludingInactive()
    } else {
      // Solo items activos (default)
      items = await ItemService.getAll()
    }

    return NextResponse.json(items || [])
  } catch (error) {
    console.error("Error al obtener items:", error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/items - Crear nuevo item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos de entrada
    const validatedData = CreateItemSchema.parse(body)
    
    // Crear el item
    const nuevoItem = await ItemService.create(validatedData)
    
    return NextResponse.json(nuevoItem, { status: 201 })
  } catch (error) {
    console.error("Error al crear item:", error)
    
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
