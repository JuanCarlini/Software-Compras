import { NextResponse } from "next/server"
import { ProyectoService } from "@/services/proyecto.service"
import { CreateProyectoSchema } from "@/shared/validation/proyecto-validation"
import { requireRole } from "@/lib/auth/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { handleRouteError } from "@/lib/route/handle-route-error"
import { createRoute } from "@/lib/route/crud-route"

export async function GET() {
  try {
    const proyectos = await ProyectoService.getAll()
    return NextResponse.json(proyectos)
  } catch (error) {
    return handleRouteError(error, "GET /api/proyectos")
  }
}

// POST /api/proyectos - Crear proyecto. Zod whitelistea el body (S4); el estado lo
// pone la DB, no el cliente (S2). Antes este POST tomaba el body crudo (mass-assignment).
export const POST = createRoute({
  autorizar: () => requireRole(ROLES_ESCRITURA),
  schema: CreateProyectoSchema,
  crear: (data) => ProyectoService.create(data),
  contexto: "POST /api/proyectos",
})
