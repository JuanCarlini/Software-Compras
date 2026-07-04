"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/views/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/views/ui/dropdown-menu"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"

interface UserMenuProps {
  userName?: string
}

export function UserMenu({ userName = "Admin" }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Error al cerrar sesión")
      }

      showSuccessToast("Sesión cerrada exitosamente")
      
      // Redirigir al login
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      showErrorToast("Error", "No se pudo cerrar la sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{userName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoading}
          className="text-red-600 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cerrando sesión...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
