import { describe, it, expect, vi, beforeEach } from "vitest"
import { OrdenPagoRepository } from "@/repositories/orden-pago.repository"
import { OrdenPagoService } from "./orden-pago.controller"

// Con el I/O aislado (A1), testeamos la lógica del service mockeando el repo: no toca la DB.
vi.mock("@/repositories/orden-pago.repository", () => ({
  OrdenPagoRepository: {
    findLastNumero: vi.fn(),
    insert: vi.fn(),
    insertLineas: vi.fn(),
    findAllWithProveedor: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const repo = vi.mocked(OrdenPagoRepository)
const year = new Date().getFullYear()

beforeEach(() => {
  vi.clearAllMocks()
  repo.insert.mockResolvedValue({ id: 1, numero_op: "X" })
  repo.insertLineas.mockResolvedValue(undefined)
})

describe("OrdenPagoService.create — numeración y estado", () => {
  it("primera OP del año: número OP-<año>-001 y estado 'pendiente'", async () => {
    repo.findLastNumero.mockResolvedValue(null)
    await OrdenPagoService.create({ proveedor_id: 1, total_pago: 100 })
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ numero_op: `OP-${year}-001`, estado: "pendiente" })
    )
  })

  it("incrementa el correlativo dentro del mismo año", async () => {
    repo.findLastNumero.mockResolvedValue(`OP-${year}-005`)
    await OrdenPagoService.create({ proveedor_id: 1, total_pago: 100 })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ numero_op: `OP-${year}-006` }))
  })

  it("reinicia el correlativo al cambiar de año", async () => {
    repo.findLastNumero.mockResolvedValue("OP-1999-009")
    await OrdenPagoService.create({ proveedor_id: 1, total_pago: 100 })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ numero_op: `OP-${year}-001` }))
  })

  it("ignora un 'estado' mandado por el cliente y fuerza 'pendiente' (S2)", async () => {
    repo.findLastNumero.mockResolvedValue(null)
    await OrdenPagoService.create({ proveedor_id: 1, total_pago: 100, estado: "pagado" })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ estado: "pendiente" }))
  })

  it("asocia las líneas al id de la OP creada", async () => {
    repo.findLastNumero.mockResolvedValue(null)
    repo.insert.mockResolvedValue({ id: 42, numero_op: `OP-${year}-001` })
    await OrdenPagoService.create({
      proveedor_id: 1,
      total_pago: 100,
      lineas: [{ concepto: "x", monto: 100, forma_pago: "transferencia" }],
    })
    expect(repo.insertLineas).toHaveBeenCalledWith([
      expect.objectContaining({ orden_pago_id: 42, concepto: "x" }),
    ])
  })
})
