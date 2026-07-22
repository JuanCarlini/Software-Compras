import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/shared/permissions-server"
import { isAdmin, stringToUserRole } from "@/shared/permissions"
import { createClient } from "@/lib/supabase/service"
import { parseId } from "@/shared/parse-id"
import { handleRouteError } from "@/shared/handle-route-error"

// PATCH /api/admin/users/[id]/role - Actualizar rol de un usuario (solo admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const { error: authError, user } = await requireAuth()
    if (authError) return authError

    // Verificar que sea admin
    if (!isAdmin(stringToUserRole(user!.rol))) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      )
    }

    const id = parseId((await params).id)
    const { rol } = await request.json()

    // Validar que el rol sea válido
    const validRoles = ['admin', 'supervisor', 'usuario', 'readonly']
    if (!validRoles.includes(rol)) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Obtener el usuario actual de gu_usuario
    const { data: currentGuUser, error: getCurrentError } = await supabase
      .from('gu_usuario')
      .select('id, email, rol_id, gu_roles(nombre)')
      .eq('id', id)
      .single()

    if (getCurrentError || !currentGuUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // No permitir que un admin se quite a sí mismo el rol de admin
    const currentRol = (currentGuUser.gu_roles as any)?.nombre?.toLowerCase()
    if (currentGuUser.id === user!.id && currentRol === 'admin' && rol !== 'admin') {
      return NextResponse.json(
        { error: "No puedes quitarte a ti mismo el rol de administrador" },
        { status: 400 }
      )
    }

    // Obtener todos los roles para ver qué hay disponible
    const { data: allRoles, error: allRolesError } = await supabase
      .from('gu_roles')
      .select('id, nombre')

    // Obtener el rol_id correspondiente al nombre del rol (case-insensitive)
    const { data: roleData, error: roleError } = await supabase
      .from('gu_roles')
      .select('id, nombre')
      .ilike('nombre', rol)
      .maybeSingle()

    if (roleError || !roleData) {
      return NextResponse.json(
        {
          error: "Rol no encontrado en el sistema",
          detalles: {
            rolBuscado: rol,
            rolesDisponibles: allRoles?.map(r => r.nombre),
            errorSupabase: roleError?.message
          }
        },
        { status: 400 }
      )
    }

    // Actualizar el rol_id en gu_usuario
    const { error: updateError } = await supabase
      .from('gu_usuario')
      .update({ rol_id: roleData.id })
      .eq('id', id)

    if (updateError) {
      console.error("Error al actualizar rol:", updateError)
      return NextResponse.json(
        { error: "Error al actualizar rol del usuario" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Rol actualizado correctamente",
      user: {
        id: currentGuUser.id,
        email: currentGuUser.email,
        rol: rol
      }
    })
  } catch (error) {
    return handleRouteError(error, "PATCH /api/admin/users/[id]/role")
  }
}
