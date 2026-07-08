import { NextRequest, NextResponse } from "next/server"
import { CertificacionService } from "@/controllers/certificacion.controller"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"
import { HttpError } from "@/shared/http-error"

// GET /api/certificaciones/lineas-oc-disponibles?ordenCompraId=N
// Líneas de esa OC con su saldo certificable (unidades certificadas / pendientes), leído
// de v_loc_rollup. Antes se consultaba por proveedorId, cuando una certificación podía
// cruzar varias OCs; en CCIP cuelga de UNA sola.
export async function GET(request: NextRequest) {
  try {
    const param = request.nextUrl.searchParams.get("ordenCompraId")
    if (!param) throw new HttpError(400, "Falta el parámetro ordenCompraId")

    const lineas = await CertificacionService.getLineasDisponibles(parseId(param))
    return NextResponse.json(lineas)
  } catch (error) {
    return handleRouteError(error, "GET /api/certificaciones/lineas-oc-disponibles")
  }
}
