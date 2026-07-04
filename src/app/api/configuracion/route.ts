import { NextRequest, NextResponse } from "next/server"
import { ConfiguracionController } from "@/controllers"
import { createErrorResponse, AppError } from "@/shared/errors"

export async function GET() {
  try {
    const [empresa, sistema] = await Promise.all([
      ConfiguracionController.getEmpresa(),
      ConfiguracionController.getConfiguracionSistema()
    ])
    
    return NextResponse.json({
      empresa,
      sistema
    })
  } catch (error) {
    console.error("Error fetching configuracion:", error)
    const errorResponse = createErrorResponse(error as Error)
    
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.error.statusCode }
    )
  }
}
