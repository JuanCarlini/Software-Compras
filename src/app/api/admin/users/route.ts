import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/shared/permissions-server"
import { isAdmin } from "@/shared/permissions"
import { UserRole } from "@/models"
import { createClient } from "@/lib/supabase/service"
import { UsuarioService } from "@/controllers/usuario.controller"
import { AuditService } from "@/lib/audit/audit.service"
import { handleRouteError } from "@/shared/handle-route-error"

// GET /api/admin/users - Listar todos los usuarios (solo admin)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { error: authError, user } = await requireAuth()
    if (authError) {
      console.error("Error de autenticación:", authError)
      return authError
    }

    // Verificar que sea admin
    if (!isAdmin(user!.rol as UserRole)) {
      console.error("Usuario no es admin:", user!.rol)
      return NextResponse.json(
        { error: "No tienes permisos para acceder a esta sección" },
        { status: 403 }
      )
    }

    // Obtener todos los usuarios de gu_usuario con sus roles
    const supabase = await createClient()
    const { data: guUsers, error } = await supabase
      .from('gu_usuario')
      .select(`
        id,
        email,
        nombre,
        rol_id,
        estado,
        created_at,
        gu_roles (
          id,
          nombre
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error al listar usuarios desde Supabase:", error)
      return NextResponse.json(
        { error: `Error al obtener usuarios: ${error.message}` },
        { status: 500 }
      )
    }

    // Mapear usuarios a formato simple con rol desde gu_roles
    const mappedUsers = (guUsers || []).map(u => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre || '',
      apellido: '', // Campo apellido no existe en gu_usuario
      rol: (u.gu_roles as any)?.nombre?.toLowerCase() || 'usuario',
      rol_id: u.rol_id,
      estado: (u as any).estado ?? 'activo',
      created_at: u.created_at,
      last_sign_in_at: null, // No tenemos esta info en gu_usuario
    }))

    return NextResponse.json(mappedUsers)
  } catch (error) {
    return handleRouteError(error, "GET /api/admin/users")
  }
}

// POST /api/admin/users - Alta de usuario (solo admin; el registro público está deshabilitado)
export async function POST(request: NextRequest) {
  try {
    const { error: authError, user } = await requireAdmin()
    if (authError) return authError

    const body = await request.json()
    const { nombre, email, password, rol_id } = body

    if (!nombre || !email || !password || !rol_id) {
      return NextResponse.json(
        { error: "nombre, email, password y rol_id son requeridos" },
        { status: 400 }
      )
    }
    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      )
    }

    const nuevo = await UsuarioService.create({ nombre, email, password, rol_id: Number(rol_id) })

    await AuditService.registrar({
      usuarioId: user!.id,
      tabla: "gu_usuario",
      registroId: nuevo.id,
      accion: "crear",
      detalle: `Usuario ${email} creado por admin`,
    })

    return NextResponse.json(nuevo, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "POST /api/admin/users")
  }
}
