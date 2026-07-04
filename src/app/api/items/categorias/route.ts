import { NextRequest, NextResponse } from "next/server"
import { ItemService } from "@/controllers"

// GET /api/items/categorias - Obtener todas las categorías únicas
export async function GET(request: NextRequest) {
  try {
    const categorias = await ItemService.getCategorias()
    return NextResponse.json(categorias || [])
  } catch (error) {
    console.error("Error al obtener categorías:", error)
    return NextResponse.json([], { status: 200 })
  }
}
