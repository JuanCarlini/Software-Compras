import { describe, it, expect, vi, beforeEach } from "vitest"
import { OrdenPagoRepository } from "@/repositories/orden-pago.repository"
import { OrdenPagoService } from "./orden-pago.controller"

// Con el I/O aislado (A1), testeamos la lógica del service mockeando el repo: no toca la DB.
vi.mock("@/repositories/orden-pago.repository", () => ({
  OrdenPagoRepository: {
    insert: vi.fn(),
    insertLineas: vi.fn(),
    findAllWithProveedor: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

const repo = vi.mocked(OrdenPagoRepository)

beforeEach(() => {
  vi.clearAllMocks()
  repo.insert.mockResolvedValue({ id: 1, numero_op: "OP-00001" } as never)
  repo.insertLineas.mockResolvedValue(undefined)
})

describe("OrdenPagoService.create — estado y numeración", () => {
  it("no manda numero_op: lo genera la DB (fn_num_op)", async () => {
    await OrdenPagoService.create({ proveedor_id: 1, fecha_op: "2026-07-07" })
    expect(repo.insert.mock.calls[0][0]).not.toHaveProperty("numero_op")
  })

  it("estado inicial 'borrador' (S2). 'pendiente' ya no existe en el enum estado_op", async () => {
    await OrdenPagoService.create({ proveedor_id: 1, fecha_op: "2026-07-07" })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ estado: "borrador" }))
  })

  it("ignora un 'estado' mandado por el cliente y fuerza 'borrador' (S2)", async () => {
    await OrdenPagoService.create({ proveedor_id: 1, estado: "pagado" })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ estado: "borrador" }))
  })

  it("asocia las líneas de factura al id de la OP creada", async () => {
    repo.insert.mockResolvedValue({ id: 42, numero_op: "OP-00042" } as never)
    await OrdenPagoService.create({
      proveedor_id: 1,
      lineas: [{ factura_id: 9, monto: 100 }],
    })
    expect(repo.insertLineas).toHaveBeenCalledWith([
      expect.objectContaining({ orden_pago_id: 42, factura_id: 9, monto: 100 }),
    ])
  })
})
