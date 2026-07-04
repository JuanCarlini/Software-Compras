import { NextRequest, NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"
import { createErrorResponse, ValidationError } from "@/shared/errors"
import { z } from "zod"

// Schema de validación para configuración del sistema
const configuracionSistemaSchema = z.object({
  notificaciones_email: z.boolean().optional(),
  notificaciones_push: z.boolean().optional(),
  backup_automatico: z.boolean().optional(),
  frecuencia_backup: z.enum(["diario", "semanal", "mensual"]).optional(),
  retencion_logs: z.number().min(1).max(365).optional(),
  tema_oscuro: z.boolean().optional(),
  idioma_interfaz: z.string().min(2).max(5).optional(),
  formato_numeros: z.string().optional(),
  decimales_moneda: z.number().min(0).max(4).optional(),
  separador_miles: z.string().length(1).optional(),
  separador_decimal: z.string().length(1).optional()
})

export async function GET() {
  try {
    const configuracion = await ConfiguracionController.getConfiguracionSistema()
    return NextResponse.json(configuracion)
  } catch (error) {
    console.error("Error fetching configuracion sistema:", error)
    const errorResponse = createErrorResponse(error as Error)
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar estructura de datos
    const validationResult = configuracionSistemaSchema.safeParse(body)
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      throw new ValidationError(
        `Error en campo '${firstError.path.join('.')}': ${firstError.message}`,
        firstError.path.join('.')
      )
    }

    const validData = validationResult.data
    const updatedConfiguracion = await ConfiguracionController.updateConfiguracionSistema(validData)
    
    return NextResponse.json(updatedConfiguracion)
  } catch (error) {
    console.error("Error updating configuracion sistema:", error)
    const errorResponse = createErrorResponse(error as Error)
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    )
  }
}
