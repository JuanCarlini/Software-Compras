"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/views/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/views/ui/tabs"
import { Loader2 } from "lucide-react"
import { showErrorToast } from "@/shared/toast-helpers"
import { api } from "@/shared/api-client"
import { useAuth } from "@/shared/auth-context"
import { isAdmin, stringToUserRole } from "@/shared/permissions"
import { useRouter } from "next/navigation"
import { UsuariosTab } from "@/views/admin-usuarios-tab"
import { RolesTab } from "@/views/admin-roles-tab"
import type { UserData, RolData } from "@/views/admin-users-shared"

// Shell de la administración de usuarios: guarda de acceso, datos compartidos
// (usuarios + roles, para los contadores) y las dos tabs. Cada tab (UsuariosTab /
// RolesTab) es autocontenida — antes esto era un god-component de ~590 líneas.
export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RolData[]>([])
  const [loading, setLoading] = useState(true)

  const userRole = user ? stringToUserRole(user.rol) : null
  const canAccess = userRole ? isAdmin(userRole) : false

  useEffect(() => {
    if (!loading && !canAccess) {
      router.push("/")
      showErrorToast("Acceso denegado", "No tienes permisos para acceder a esta sección")
    }
  }, [canAccess, loading, router])

  useEffect(() => {
    Promise.all([fetchUsers(), fetchRoles()]).finally(() => setLoading(false))
  }, [])

  const fetchUsers = async () => {
    try {
      setUsers(await api("/api/admin/users"))
    } catch {
      showErrorToast("Error", "No se pudieron cargar los usuarios")
    }
  }

  const fetchRoles = async () => {
    try {
      setRoles(await api("/api/admin/roles"))
    } catch {
      showErrorToast("Error", "No se pudieron cargar los roles")
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
        <h1 className="text-3xl font-bold text-foreground">Administración de Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Alta, baja, roles y claves de los usuarios del sistema
        </p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <UsuariosTab
            users={users}
            setUsers={setUsers}
            roles={roles}
            refetchUsers={fetchUsers}
            refetchRoles={fetchRoles}
          />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab roles={roles} refetchRoles={fetchRoles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
