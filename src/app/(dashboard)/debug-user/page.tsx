"use client"

import { useAuth } from "@/shared/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { stringToUserRole, isAdmin } from "@/shared/permissions"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

export default function DebugUserPage() {
  const { user, loading, refreshUser } = useAuth()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshUser()
    setTimeout(() => setRefreshing(false), 500)
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  const userRole = user ? stringToUserRole(user.rol) : null
  const userIsAdmin = userRole ? isAdmin(userRole) : false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug - Información del Usuario</h1>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refrescar Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Usuario Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Usuario completo:</p>
              <pre className="bg-slate-100 p-4 rounded mt-2 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="font-semibold">Email:</p>
                <p className="text-slate-600">{user?.email || 'N/A'}</p>
              </div>

              <div>
                <p className="font-semibold">Nombre:</p>
                <p className="text-slate-600">{user?.nombre || 'N/A'}</p>
              </div>

              <div>
                <p className="font-semibold">Rol (string):</p>
                <p className="text-slate-600">{user?.rol || 'N/A'}</p>
              </div>

              <div>
                <p className="font-semibold">Rol (enum):</p>
                <p className="text-slate-600">{userRole || 'N/A'}</p>
              </div>

              <div>
                <p className="font-semibold">¿Es Admin?:</p>
                <p className={userIsAdmin ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {userIsAdmin ? "SÍ" : "NO"}
                </p>
              </div>

              <div>
                <p className="font-semibold">User ID:</p>
                <p className="text-slate-600 text-xs">{user?.id || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-800">⚠️ Instrucciones:</p>
              <ol className="list-decimal list-inside text-sm text-yellow-700 mt-2 space-y-1">
                <li>Si el rol NO es "admin", actualízalo en Supabase</li>
                <li>Después de actualizar, CIERRA SESIÓN</li>
                <li>Vuelve a INICIAR SESIÓN</li>
                <li>El rol se actualizará automáticamente</li>
              </ol>
            </div>

            {!userIsAdmin && user?.rol !== 'admin' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold text-blue-800">📝 SQL para actualizar tu rol:</p>
                <pre className="bg-white p-3 rounded mt-2 text-sm overflow-auto">
{`UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{rol}',
  '"admin"'
)
WHERE email = '${user?.email}';`}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
