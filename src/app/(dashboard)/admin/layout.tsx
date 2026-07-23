"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { isAdmin, stringToUserRole } from "@/shared/permissions"
import { showErrorToast } from "@/shared/toast-helpers"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Verificar permisos
  const userRole = user ? stringToUserRole(user.rol) : null
  const canAccess = userRole ? isAdmin(userRole) : false

  useEffect(() => {
    if (!loading && !canAccess) {
      showErrorToast(
        "Acceso denegado",
        "No tienes permisos para acceder a la sección de administración"
      )
      router.push("/dashboard")
    }
  }, [canAccess, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return <>{children}</>
}
