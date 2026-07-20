"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/views/ui/card"
import { Button } from "@/views/ui/button"
import { Input } from "@/views/ui/input"
import { Label } from "@/views/ui/label"
import { Badge } from "@/views/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/views/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/views/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/views/ui/select"
import { Loader2, Shield, ShieldCheck, User, Eye, Users, UserPlus, KeyRound, UserX, UserCheck, Plus, Trash2 } from "lucide-react"
import { showSuccessToast, showErrorToast } from "@/shared/toast-helpers"
import { useAuth } from "@/shared/auth-context"
import { isAdmin, stringToUserRole } from "@/shared/permissions"
import { RolPermisosMatrix } from "@/views/rol-permisos-matrix"
import { useRouter } from "next/navigation"

interface UserData {
  id: string
  email: string
  nombre: string
  rol: string
  rol_id: number
  estado: "activo" | "inactivo"
  created_at: string
}

interface RolData {
  id: number
  nombre: string
  descripcion: string | null
  usuarios: number
  es_sistema: boolean
  permisos: string[]
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
  readonly: "text-muted-foreground",
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`)
  return body
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RolData[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  // diálogos
  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: "", email: "", password: "", rol_id: "2" })
  const [resetUser, setResetUser] = useState<UserData | null>(null)
  const [resetPass, setResetPass] = useState("")
  const [nuevoRolOpen, setNuevoRolOpen] = useState(false)
  const [nuevoRol, setNuevoRol] = useState<{ nombre: string; descripcion: string; permisos: string[] }>({ nombre: "", descripcion: "", permisos: [] })
  const [editRol, setEditRol] = useState<RolData | null>(null)
  const [editPermisos, setEditPermisos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

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

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId)
    try {
      await api(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: newRole }),
      })
      showSuccessToast("Rol actualizado")
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, rol: newRole } : u)))
      if (userId.toString() === user?.id?.toString()) {
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (error) {
      showErrorToast("Error al actualizar rol", error instanceof Error ? error.message : "Intenta nuevamente")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevo, rol_id: Number(nuevo.rol_id) }),
      })
      showSuccessToast("Usuario creado", nuevo.email)
      setNuevoOpen(false)
      setNuevo({ nombre: "", email: "", password: "", rol_id: "2" })
      await fetchUsers()
      await fetchRoles()
    } catch (error) {
      showErrorToast("Error", error instanceof Error ? error.message : "No se pudo crear el usuario")
    } finally {
      setSaving(false)
    }
  }

  const handleBaja = async (u: UserData) => {
    setUpdatingUserId(u.id)
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" })
      showSuccessToast("Usuario dado de baja", u.email)
      setUsers(prev => prev.map(x => (x.id === u.id ? { ...x, estado: "inactivo" } : x)))
    } catch (error) {
      showErrorToast("Error", error instanceof Error ? error.message : "No se pudo dar de baja")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleReactivar = async (u: UserData) => {
    setUpdatingUserId(u.id)
    try {
      await api(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "activo" }),
      })
      showSuccessToast("Usuario reactivado", u.email)
      setUsers(prev => prev.map(x => (x.id === u.id ? { ...x, estado: "activo" } : x)))
    } catch (error) {
      showErrorToast("Error", error instanceof Error ? error.message : "No se pudo reactivar")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleResetClave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUser) return
    setSaving(true)
    try {
      await api(`/api/admin/users/${resetUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPass }),
      })
      showSuccessToast("Clave reseteada", `Comunicale la nueva clave a ${resetUser.email}`)
      setResetUser(null)
      setResetPass("")
    } catch (error) {
      showErrorToast("Error", error instanceof Error ? error.message : "No se pudo resetear la clave")
    } finally {
      setSaving(false)
    }
  }

  const handleCrearRol = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoRol),
      })
      showSuccessToast("Rol creado", nuevoRol.nombre)
      setNuevoRolOpen(false)
      setNuevoRol({ nombre: "", descripcion: "", permisos: [] })
      await fetchRoles()
    } catch (error) {
      showErrorToast("Error", error instanceof Error ? error.message : "No se pudo crear el rol")
    } finally {
      setSaving(false)
    }
  }

  const esRolAdmin = editRol?.nombre === "admin"

  const handleGuardarPermisos = async () => {
    if (!editRol || esRolAdmin) return
    setSaving(true)
    try {
      await api(`/api/admin/roles/${editRol.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permisos: editPermisos }),
      })
      showSuccessToast("Permisos actualizados", editRol.nombre)
      setEditRol(null)
      await fetchRoles()
    } catch (error) {
      showErrorToast("Error", error instanceof Error ? error.message : "No se pudieron guardar los permisos")
    } finally {
      setSaving(false)
    }
  }

  const handleEliminarRol = async (rol: RolData) => {
    try {
      await api(`/api/admin/roles/${rol.id}`, { method: "DELETE" })
      showSuccessToast("Rol eliminado", rol.nombre)
      await fetchRoles()
    } catch (error) {
      showErrorToast("Error", error instanceof Error ? error.message : "No se pudo eliminar el rol")
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administración de Usuarios</h1>
          <p className="text-muted-foreground mt-2">
            Alta, baja, roles y claves de los usuarios del sistema
          </p>
        </div>
        <Button onClick={() => setNuevoOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="roles">Roles ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay usuarios registrados</p>
                  </div>
                ) : (
                  users.map((userData) => {
                    const RoleIcon = roleIcons[userData.rol] || User
                    const roleColor = roleColors[userData.rol] || "text-muted-foreground"
                    const esUnoMismo = userData.id.toString() === user?.id?.toString()

                    return (
                      <div
                        key={userData.id}
                        className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors ${userData.estado === "inactivo" ? "opacity-60" : ""}`}
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div>
                            <p className="font-medium text-foreground">{userData.nombre}</p>
                            <p className="text-sm text-muted-foreground">{userData.email}</p>
                            <div className="flex gap-1 mt-1">
                              {esUnoMismo && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Tú</span>
                              )}
                              <Badge variant={userData.estado === "activo" ? "outline" : "destructive"}>
                                {userData.estado}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <RoleIcon className={`h-5 w-5 ${roleColor} mr-2`} />
                            <span className={`font-medium ${roleColor}`}>
                              {roleLabels[userData.rol] || userData.rol}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Select
                              value={userData.rol}
                              onValueChange={(value) => handleRoleChange(userData.id, value)}
                              disabled={updatingUserId === userData.id || esUnoMismo}
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
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              title="Resetear clave"
                              onClick={() => setResetUser(userData)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            {userData.estado === "activo" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                title="Dar de baja"
                                disabled={esUnoMismo || updatingUserId === userData.id}
                                onClick={() => handleBaja(userData)}
                              >
                                <UserX className="h-4 w-4 text-red-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                title="Reactivar"
                                disabled={updatingUserId === userData.id}
                                onClick={() => handleReactivar(userData)}
                              >
                                <UserCheck className="h-4 w-4 text-green-600" />
                              </Button>
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
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Catálogo de roles</CardTitle>
              <Button size="sm" onClick={() => setNuevoRolOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo rol
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles.map((rol) => (
                  <div key={rol.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{rol.nombre}</p>
                        {rol.es_sistema && <Badge variant="outline">sistema</Badge>}
                        <Badge variant="secondary">{rol.usuarios} usuario(s)</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rol.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Editar permisos"
                        aria-label={`Editar permisos de ${rol.nombre}`}
                        onClick={() => { setEditRol(rol); setEditPermisos(rol.permisos ?? []) }}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title={rol.es_sistema ? "Los roles del sistema no se eliminan" : "Eliminar rol"}
                        aria-label={`Eliminar rol ${rol.nombre}`}
                        disabled={rol.es_sistema || rol.usuarios > 0}
                        onClick={() => handleEliminarRol(rol)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Los roles del sistema (admin, supervisor, usuario, readonly) no pueden renombrarse ni
                eliminarse. Los permisos de cada rol se asignan con la matriz (botón{" "}
                <ShieldCheck className="inline h-3 w-3 align-text-bottom" />): tildá por módulo y acción
                qué puede hacer cada rol. El rol admin tiene acceso total y no es editable.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: nuevo usuario */}
      <Dialog open={nuevoOpen} onOpenChange={setNuevoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCrearUsuario} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} required />
            </div>
            <div>
              <Label>Contraseña inicial *</Label>
              <Input type="password" minLength={6} value={nuevo.password} onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })} required />
            </div>
            <div>
              <Label>Rol *</Label>
              <Select value={nuevo.rol_id} onValueChange={(v) => setNuevo({ ...nuevo, rol_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{roleLabels[r.nombre] || r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setNuevoOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear usuario
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: reset de clave */}
      <Dialog open={resetUser !== null} onOpenChange={(open) => { if (!open) { setResetUser(null); setResetPass("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear clave de {resetUser?.email}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetClave} className="space-y-4">
            <div>
              <Label>Nueva contraseña *</Label>
              <Input type="text" minLength={6} value={resetPass} onChange={(e) => setResetPass(e.target.value)} required />
              <p className="text-xs text-muted-foreground mt-1">
                Se muestra en texto plano para que puedas comunicársela al usuario (mecanismo de recuperación de clave).
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setResetUser(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resetear
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: nuevo rol */}
      <Dialog open={nuevoRolOpen} onOpenChange={setNuevoRolOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo rol</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCrearRol} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={nuevoRol.nombre} onChange={(e) => setNuevoRol({ ...nuevoRol, nombre: e.target.value })} required />
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={nuevoRol.descripcion} onChange={(e) => setNuevoRol({ ...nuevoRol, descripcion: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Permisos</Label>
              <RolPermisosMatrix
                value={nuevoRol.permisos}
                onChange={(permisos) => setNuevoRol({ ...nuevoRol, permisos })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setNuevoRolOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear rol
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: editar permisos de un rol */}
      <Dialog open={editRol !== null} onOpenChange={(open) => { if (!open) setEditRol(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Permisos de {editRol?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {esRolAdmin && (
              <p className="text-sm text-muted-foreground">
                El rol <span className="font-medium text-foreground">admin</span> tiene acceso total a
                todos los módulos y no es editable.
              </p>
            )}
            <RolPermisosMatrix
              value={editPermisos}
              onChange={setEditPermisos}
              readOnly={esRolAdmin}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditRol(null)}>
                {esRolAdmin ? "Cerrar" : "Cancelar"}
              </Button>
              {!esRolAdmin && (
                <Button type="button" disabled={saving} onClick={handleGuardarPermisos}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar permisos
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
