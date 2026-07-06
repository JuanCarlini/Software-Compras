import { describe, it, expect, vi, beforeEach } from "vitest"
import { OrdenCompraRepository } from "@/repositories/orden-compra.repository"
import { ItemService } from "./item.controller"
import { OrdenCompraService } from "./orden-compra.controller"

vi.mock("@/repositories/orden-compra.repository", () => ({
  OrdenCompraRepository: {
    insert: vi.fn(),
    insertLineas: vi.fn(),
    deleteById: vi.fn(),
    insertLinea: vi.fn(),
    findLineaById: vi.fn(),
    updateLinea: vi.fn(),
  },
}))
// createLineFromItem consulta el catálogo vía ItemService: lo mockeamos también.
vi.mock("./item.controller", () => ({
  ItemService: { getById: vi.fn() },
}))

const repo = vi.mocked(OrdenCompraRepository)
const itemSvc = vi.mocked(ItemService)

beforeEach(() => {
  vi.clearAllMocks()
  repo.insert.mockResolvedValue({ id: 1 })
  repo.insertLineas.mockResolvedValue(undefined)
})

describe("OrdenCompraService.create — estado y compensación", () => {
  it("fuerza estado 'borrador' aunque el cliente mande otro (S2)", async () => {
    await OrdenCompraService.create({ numero_oc: "OC-1", proveedor_id: 1, estado: "aprobado" } as any)
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ estado: "borrador" }))
  })

  it("asocia las líneas al id de la OC creada", async () => {
    repo.insert.mockResolvedValue({ id: 55 })
    await OrdenCompraService.create({
      numero_oc: "OC-1",
      proveedor_id: 1,
      lineas: [{ descripcion: "x", cantidad: 1 }],
    } as any)
    expect(repo.insertLineas).toHaveBeenCalledWith([
      expect.objectContaining({ orden_compra_id: 55, descripcion: "x" }),
    ])
  })

  it("compensa borrando la OC si fallan las líneas (trigger del 100%)", async () => {
    repo.insert.mockResolvedValue({ id: 55 })
    repo.insertLineas.mockRejectedValue(new Error("trigger 100%"))
    await expect(
      OrdenCompraService.create({ numero_oc: "OC-1", proveedor_id: 1, lineas: [{ descripcion: "x" }] } as any)
    ).rejects.toThrow("trigger 100%")
    expect(repo.deleteById).toHaveBeenCalledWith(55)
  })
})

describe("OrdenCompraService.createLineFromItem — cálculo de totales", () => {
  it("usa el precio sugerido del item y calcula neto + IVA cuando no se provee precio", async () => {
    itemSvc.getById.mockResolvedValue({ id: 9, nombre: "Cemento", precio_sugerido: 10 } as any)
    repo.insertLinea.mockImplementation(async (l: any) => l)

    const linea: any = await OrdenCompraService.createLineFromItem(7, { item_id: 9, cantidad: 4 } as any)

    expect(linea).toMatchObject({
      orden_compra_id: 7,
      item_id: 9,
      descripcion: "Cemento", // usa el nombre del item si no hay descripción
      precio_unitario_neto: 10,
      cantidad: 4,
      iva_porcentaje: 21,
      total_neto: 40,
      estado: "borrador",
    })
    expect(linea.total_con_iva).toBeCloseTo(48.4, 5) // 40 * 1.21
  })

  it("respeta precio, IVA y descripción explícitos", async () => {
    itemSvc.getById.mockResolvedValue({ id: 9, nombre: "Cemento", precio_sugerido: 10 } as any)
    repo.insertLinea.mockImplementation(async (l: any) => l)

    const linea: any = await OrdenCompraService.createLineFromItem(7, {
      item_id: 9,
      cantidad: 2,
      precio_unitario_neto: 100,
      iva_porcentaje: 10,
      descripcion: "Especial",
    } as any)

    expect(linea).toMatchObject({ descripcion: "Especial", precio_unitario_neto: 100, total_neto: 200 })
    expect(linea.total_con_iva).toBeCloseTo(220, 5) // 200 * 1.10
  })

  it("lanza si el item no existe", async () => {
    itemSvc.getById.mockResolvedValue(null)
    await expect(
      OrdenCompraService.createLineFromItem(7, { item_id: 99, cantidad: 1 } as any)
    ).rejects.toThrow(/no encontrado/)
  })
})

describe("OrdenCompraService.updateLine — recálculo de totales", () => {
  it("recalcula totales cuando cambia la cantidad", async () => {
    repo.findLineaById.mockResolvedValue({ cantidad: 1, precio_unitario_neto: 100, iva_porcentaje: 21 })
    repo.updateLinea.mockImplementation(async (_id: number, u: any) => u)

    await OrdenCompraService.updateLine(3, { cantidad: 5 })

    expect(repo.updateLinea).toHaveBeenCalledWith(3, expect.objectContaining({ cantidad: 5, total_neto: 500 }))
    const updates = repo.updateLinea.mock.calls[0][1] as any
    expect(updates.total_con_iva).toBeCloseTo(605, 5) // 500 * 1.21
  })

  it("no recalcula (ni consulta la línea) si sólo cambia la descripción", async () => {
    repo.updateLinea.mockImplementation(async (_id: number, u: any) => u)
    await OrdenCompraService.updateLine(3, { descripcion: "nuevo" } as any)
    expect(repo.findLineaById).not.toHaveBeenCalled()
    expect(repo.updateLinea).toHaveBeenCalledWith(3, { descripcion: "nuevo" })
  })
})
