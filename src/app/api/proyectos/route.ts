import { NextRequest, NextResponse } from "next/server"
import { ProyectoService } from "@/controllers/proyecto.controller"
import { requireRole } from "@/shared/permissions-server"
import { ROLES_ESCRITURA } from "@/shared/permissions"

export async function GET() {
  try {
    const proyectos = await ProyectoService.getAll()
    return NextResponse.json(proyectos)
  } catch (error) {
    console.error("Error fetching proyectos:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(ROLES_ESCRITURA)
    if (authError) return authError

    const data = await request.json()
    const newProyecto = await ProyectoService.create(data)
    return NextResponse.json(newProyecto, { status: 201 })
  } catch (error) {
    console.error("Error creating proyecto:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
