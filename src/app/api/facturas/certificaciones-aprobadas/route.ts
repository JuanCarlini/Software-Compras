import { NextRequest, NextResponse } from "next/server"
import { FacturaService } from "@/controllers/factura.controller"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { HttpError } from "@/shared/http-error"

// GET /api/facturas/certificaciones-aprobadas?proveedorId=N
// Certificaciones aprobadas del proveedor, para elegir a cuáles imputar la factura.
export async function GET(request: NextRequest) {
  try {
    const param = request.nextUrl.searchParams.get("proveedorId")
    if (!param) throw new HttpError(400, "Falta el parámetro proveedorId")

    const certificaciones = await FacturaService.getCertificacionesAprobadas(parseId(param))
    return NextResponse.json(certificaciones)
  } catch (error) {
    return handleRouteError(error, "GET /api/facturas/certificaciones-aprobadas")
  }
}
