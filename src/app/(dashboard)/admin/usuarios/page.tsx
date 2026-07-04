"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/views/ui/select"
import { Loader2, Shield, User, Eye, Users } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"
import { useAuth } from "@/shared/auth-context"
import { isAdmin, stringToUserRole } from "@/shared/permissions"
import { useRouter } from "next/navigation"

interface UserData {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: string
  created_at: string
  last_sign_in_at: string | null
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  usuario: "Usuario",
  readonly: "Solo Lectura",
}

const roleIcons: Record<string, any> = {
  admin: Shield,
  supervisor: Eye,
  usuario: User,
  readonly: Users,
}

const roleColors: Record<string, string> = {
  admin: "text-red-600",
  supervisor: "text-blue-600",
  usuario: "text-green-600",
  readonly: "text-gray-600",
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  // Verificar permisos
  const userRole = user ? stringToUserRole(user.rol) : null
  const canAccess = userRole ? isAdmin(userRole) : false

  useEffect(() => {
    if (!loading && !canAccess) {
      router.push("/")
      showErrorToast("Acceso denegado", "No tienes permisos para acceder a esta sección")
    }
  }, [canAccess, loading, router])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) {
        throw new Error("Error al obtener usuarios")
      }
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error:", error)
      showErrorToast("Error", "No se pudieron cargar los usuarios")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rol: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar rol")
      }

      showSuccessToast("Rol actualizado", `El rol se ha actualizado correctamente`)

      // Actualizar la lista de usuarios
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, rol: newRole } : u
        )
      )

      // Si el usuario actualizó su propio rol, recargar la página
      if (userId.toString() === user?.id?.toString()) {
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      console.error("Error:", error)
      showErrorToast(
        "Error al actualizar rol",
        error instanceof Error ? error.message : "Por favor intenta nuevamente"
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando usuarios...</span>
        </CardContent>
      </Card>
    )
  }

  if (!canAccess) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Administración de Usuarios
        </h1>
        <p className="text-slate-600 mt-2">
          Gestiona los roles y permisos de los usuarios del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No hay usuarios registrados</p>
              </div>
            ) : (
              users.map((userData) => {
                const RoleIcon = roleIcons[userData.rol] || User
                const roleColor = roleColors[userData.rol] || "text-gray-600"

                return (
                  <div
                    key={userData.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Columna 1: Información del usuario */}
                      <div>
                        <p className="font-medium text-slate-900">
                          {userData.nombre} {userData.apellido}
                        </p>
                        <p className="text-sm text-slate-500">{userData.email}</p>
                        {userData.id.toString() === user?.id?.toString() && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                            Tú
                          </span>
                        )}
                      </div>

                      {/* Columna 2: Rol actual */}
                      <div className="flex items-center">
                        <RoleIcon className={`h-5 w-5 ${roleColor} mr-2`} />
                        <span className={`font-medium ${roleColor}`}>
                          {roleLabels[userData.rol] || userData.rol}
                        </span>
                      </div>

                      {/* Columna 3: Cambiar rol */}
                      <div className="flex items-center space-x-2">
                        <Select
                          value={userData.rol}
                          onValueChange={(value) => handleRoleChange(userData.id, value)}
                          disabled={updatingUserId === userData.id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="usuario">Usuario</SelectItem>
                            <SelectItem value="readonly">Solo Lectura</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingUserId === userData.id && (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Información sobre roles</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                <li>
                  <strong>Administrador:</strong> Acceso completo al sistema, puede
                  gestionar usuarios y realizar todas las acciones
                </li>
                <li>
                  <strong>Supervisor:</strong> Puede aprobar, rechazar y anular documentos
                </li>
                <li>
                  <strong>Usuario:</strong> Acceso básico, no puede anular documentos ni
                  modificar proveedores
                </li>
                <li>
                  <strong>Solo Lectura:</strong> Solo puede visualizar información sin
                  realizar cambios
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
