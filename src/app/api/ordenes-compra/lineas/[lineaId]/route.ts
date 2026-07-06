import { NextRequest, NextResponse } from "next/server"
import { OrdenCompraService } from "@/controllers"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { z } from "zod"

interface Params {
  params: Promise<{
    lineaId: string
  }>
}

// Schema de validación para actualizar línea
const UpdateLineaSchema = z.object({
  item_id: z.number().positive().optional(),
  descripcion: z.string().optional(),
  cantidad: z.number().positive("Cantidad debe ser mayor a 0").optional(),
  precio_unitario_neto: z.number().nonnegative("Precio no puede ser negativo").optional(),
  iva_porcentaje: z.number().nonnegative("IVA no puede ser negativo").optional()
})

// PUT /api/ordenes-compra/lineas/[lineaId] - Actualizar una línea
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const { lineaId } = await params
    const lineaIdNum = parseInt(lineaId)

    if (isNaN(lineaIdNum)) {
      return NextResponse.json(
        { error: "ID de línea inválido" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validar datos
    const validatedData = UpdateLineaSchema.parse(body)

    // Actualizar línea (los totales se recalculan automáticamente)
    const lineaActualizada = await OrdenCompraService.updateLine(lineaIdNum, validatedData)
    
    if (!lineaActualizada) {
      return NextResponse.json(
        { error: "Línea no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(lineaActualizada)
  } catch (error) {
    console.error("Error al actualizar línea:", error)
    
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

// DELETE /api/ordenes-compra/lineas/[lineaId] - Eliminar una línea
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const { lineaId } = await params
    const lineaIdNum = parseInt(lineaId)

    if (isNaN(lineaIdNum)) {
      return NextResponse.json(
        { error: "ID de línea inválido" },
        { status: 400 }
      )
    }

    const success = await OrdenCompraService.deleteLine(lineaIdNum)
    
    if (!success) {
      return NextResponse.json(
        { error: "Línea no encontrada" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      message: "Línea eliminada correctamente" 
    })
  } catch (error) {
    console.error("Error al eliminar línea:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
