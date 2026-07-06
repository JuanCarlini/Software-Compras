import { describe, it, expect, vi, beforeEach } from "vitest"
import bcrypt from "bcryptjs"
import { UsuarioRepository } from "@/repositories/usuario.repository"
import { UsuarioService } from "./usuario.controller"

vi.mock("@/repositories/usuario.repository", () => ({
  UsuarioRepository: {
    findByEmail: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    updatePassword: vi.fn(),
  },
}))
// bcrypt mockeado: determinístico y rápido (no queremos hashear de verdad en el test).
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(async (pw: string) => `hash(${pw})`) },
}))

const repo = vi.mocked(UsuarioRepository)
const bcryptMock = vi.mocked(bcrypt)

beforeEach(() => vi.clearAllMocks())

describe("UsuarioService.create", () => {
  it("rechaza si el email ya está registrado (no inserta)", async () => {
    repo.findByEmail.mockResolvedValue({ id: 1 })
    await expect(
      UsuarioService.create({ nombre: "A", email: "a@b.com", password: "x", rol_id: 2 })
    ).rejects.toThrow(/email ya está registrado/)
    expect(repo.insert).not.toHaveBeenCalled()
  })

  it("hashea la clave e inserta con estado 'activo'", async () => {
    repo.findByEmail.mockResolvedValue(null)
    repo.insert.mockResolvedValue({ id: 1 })

    await UsuarioService.create({ nombre: "A", email: "a@b.com", password: "secreto", rol_id: 3 })

    expect(bcryptMock.hash).toHaveBeenCalledWith("secreto", 10)
    expect(repo.insert).toHaveBeenCalledWith({
      nombre: "A",
      email: "a@b.com",
      password_hash: "hash(secreto)",
      rol_id: 3,
      estado: "activo",
    })
  })
})

describe("UsuarioService.resetPassword", () => {
  it("hashea la nueva clave y la persiste vía updatePassword", async () => {
    repo.updatePassword.mockResolvedValue(undefined)

    const ok = await UsuarioService.resetPassword(5, "nueva")

    expect(bcryptMock.hash).toHaveBeenCalledWith("nueva", 10)
    expect(repo.updatePassword).toHaveBeenCalledWith(5, "hash(nueva)")
    expect(ok).toBe(true)
  })
})
