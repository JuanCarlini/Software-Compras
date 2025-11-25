import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { z } from "zod"

interface Params {
  params: {
    id: string
  }
}

// GET /api/ordenes-compra/[id]/lineas - Obtener líneas con información de items
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const ordenId = parseInt(params.id)
    
    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: "ID de orden inválido" },
        { status: 400 }
      )
    }

    // Obtener líneas con información de items del catálogo
    const lineas = await OrdenCompraService.getLinesWithItems(ordenId)
    
    return NextResponse.json(lineas || [])
  } catch (error) {
    console.error("Error al obtener líneas con items:", error)
    return NextResponse.json([], { status: 200 })
  }
}

// Schema de validación para crear línea desde item
const CreateLineaFromItemSchema = z.object({
  item_id: z.number().positive("Item ID debe ser positivo"),
  cantidad: z.number().positive("Cantidad debe ser mayor a 0"),
  precio_unitario_neto: z.number().nonnegative("Precio no puede ser negativo").optional(),
  iva_porcentaje: z.number().nonnegative("IVA no puede ser negativo").optional(),
  descripcion: z.string().optional()
})

// POST /api/ordenes-compra/[id]/lineas - Crear línea desde item del catálogo
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const ordenId = parseInt(params.id)
    
    if (isNaN(ordenId)) {
      return NextResponse.json(
        { error: "ID de orden inválido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validar datos
    const validatedData = CreateLineaFromItemSchema.parse(body)
    
    // Crear línea desde item
    const nuevaLinea = await OrdenCompraService.createLineFromItem(ordenId, validatedData)
    
    return NextResponse.json(nuevaLinea, { status: 201 })
  } catch (error) {
    console.error("Error al crear línea desde item:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes("no encontrado")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
