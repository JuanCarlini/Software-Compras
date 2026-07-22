import { describe, it, expect, vi, beforeEach } from "vitest"
import { getCurrentUser } from "@/lib/auth/auth.cookies"
import { RolRepository } from "@/repositories/rol.repository"
import { ROLES_ESCRITURA } from "@/shared/permissions"
import { requireAuth, requireAdmin, requireRole, requirePermission } from "./permissions-server"

// Enforcement RBAC (S1): la barrera de autorización de toda ruta mutante. Antes sin un
// solo test. Se mockea la frontera (cookie + repo de permisos) y se ejerce la decisión real.
vi.mock("@/lib/auth/auth.cookies", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/repositories/rol.repository", () => ({
  RolRepository: { findPermisosByNombre: vi.fn() },
}))

const getUser = vi.mocked(getCurrentUser)
const rolRepo = vi.mocked(RolRepository)

// getCurrentUser devuelve el usuario "crudo"; getAuthenticatedUser lee rol_nombre.
const comoRol = (rol_nombre: string, id = 1) =>
  getUser.mockResolvedValue({ id, email: "a@b.com", nombre: "A", rol_nombre } as any)

beforeEach(() => vi.clearAllMocks())

describe("requireAuth", () => {
  it("401 sin usuario", async () => {
    getUser.mockResolvedValue(null as any)
    const { error, user } = await requireAuth()
    expect(user).toBeNull()
    expect(error?.status).toBe(401)
  })

  it("pasa con usuario autenticado", async () => {
    comoRol("usuario")
    const { error, user } = await requireAuth()
    expect(error).toBeNull()
    expect(user?.rol).toBe("usuario")
  })
})

describe("requireAdmin", () => {
  it("401 sin usuario", async () => {
    getUser.mockResolvedValue(null as any)
    expect((await requireAdmin()).error?.status).toBe(401)
  })

  it("403 si el rol no es admin", async () => {
    comoRol("supervisor")
    const { error, user } = await requireAdmin()
    expect(user).toBeNull()
    expect(error?.status).toBe(403)
  })

  it("pasa si es admin", async () => {
    comoRol("admin")
    expect((await requireAdmin()).error).toBeNull()
  })
})

describe("requireRole", () => {
  it("401 sin usuario", async () => {
    getUser.mockResolvedValue(null as any)
    expect((await requireRole(ROLES_ESCRITURA)).error?.status).toBe(401)
  })

  it("403 si el rol no está en la lista (readonly fuera de ESCRITURA)", async () => {
    comoRol("readonly")
    const { error, user } = await requireRole(ROLES_ESCRITURA)
    expect(user).toBeNull()
    expect(error?.status).toBe(403)
  })

  it("pasa si el rol está en la lista", async () => {
    comoRol("usuario")
    expect((await requireRole(ROLES_ESCRITURA)).error).toBeNull()
  })
})

describe("requirePermission", () => {
  it("401 sin usuario (ni consulta permisos)", async () => {
    getUser.mockResolvedValue(null as any)
    expect((await requirePermission("ordenes_compra", "crear")).error?.status).toBe(401)
    expect(rolRepo.findPermisosByNombre).not.toHaveBeenCalled()
  })

  it("admin pasa aunque no tenga permisos explícitos (short-circuit)", async () => {
    comoRol("admin")
    rolRepo.findPermisosByNombre.mockResolvedValue([])
    expect((await requirePermission("ordenes_compra", "crear")).error).toBeNull()
  })

  it("403 si el rol no tiene el permiso modulo:accion", async () => {
    comoRol("usuario")
    rolRepo.findPermisosByNombre.mockResolvedValue([])
    expect((await requirePermission("ordenes_compra", "crear")).error?.status).toBe(403)
  })

  it("pasa si el rol tiene el permiso modulo:accion", async () => {
    comoRol("usuario")
    rolRepo.findPermisosByNombre.mockResolvedValue(["ordenes_compra:crear"])
    expect((await requirePermission("ordenes_compra", "crear")).error).toBeNull()
  })
})
