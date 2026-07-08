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
    findLineasByOrdenId: vi.fn(),
    update: vi.fn(),
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
  repo.insert.mockResolvedValue({ id: 1 } as never)
  repo.insertLineas.mockResolvedValue(undefined)
  repo.findLineasByOrdenId.mockResolvedValue([])
})

describe("OrdenCompraService.create — estado, numeración y compensación", () => {
  it("fuerza estado 'borrador' aunque el cliente mande otro (S2)", async () => {
    await OrdenCompraService.create({ proveedor_id: 1, estado: "aprobado" } as never)
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ estado: "borrador" }))
  })

  it("no manda numero_oc: lo genera la DB (fn_num_oc)", async () => {
    await OrdenCompraService.create({ proveedor_id: 1, fecha_oc: "2026-07-07" } as never)
    expect(repo.insert.mock.calls[0][0]).not.toHaveProperty("numero_oc")
  })

  it("asocia las líneas al id de la OC creada y les calcula los totales", async () => {
    repo.insert.mockResolvedValue({ id: 55 } as never)
    await OrdenCompraService.create({
      proveedor_id: 1,
      lineas: [{ item_id: 9, descripcion: "x", cantidad: 10, precio_unitario_neto: 9500 }],
    } as never)
    expect(repo.insertLineas).toHaveBeenCalledWith([
      expect.objectContaining({
        orden_compra_id: 55,
        descripcion: "x",
        iva_porcentaje: 21,
        total_neto: 95000,
        total_con_iva: 114950,
      }),
    ])
  })

  it("recalcula los totales de la cabecera desde las líneas persistidas", async () => {
    repo.insert.mockResolvedValue({ id: 55 } as never)
    repo.findLineasByOrdenId.mockResolvedValue([
      { total_neto: 95000, total_con_iva: 114950 },
      { total_neto: 5000, total_con_iva: 5000 },
    ] as never)

    await OrdenCompraService.create({
      proveedor_id: 1,
      lineas: [{ item_id: 9, cantidad: 10, precio_unitario_neto: 9500 }],
    } as never)

    expect(repo.update).toHaveBeenCalledWith(55, {
      total_neto: 100000,
      total_iva: 19950,
      total_con_iva: 119950,
    })
  })

  it("compensa borrando la OC si fallan las líneas (p.ej. un trigger las rechaza)", async () => {
    repo.insert.mockResolvedValue({ id: 55 } as never)
    repo.insertLineas.mockRejectedValue(new Error("trigger"))
    await expect(
      OrdenCompraService.create({
        proveedor_id: 1,
        lineas: [{ item_id: 9, cantidad: 1, precio_unitario_neto: 1 }],
      } as never)
    ).rejects.toThrow("trigger")
    expect(repo.deleteById).toHaveBeenCalledWith(55)
  })

  it("rechaza una línea sin precio con 422 (el item ya no tiene precio_sugerido)", async () => {
    repo.insert.mockResolvedValue({ id: 55 } as never)
    await expect(
      OrdenCompraService.create({ proveedor_id: 1, lineas: [{ item_id: 9, cantidad: 1 }] } as never)
    ).rejects.toMatchObject({ status: 422 })
    expect(repo.deleteById).toHaveBeenCalledWith(55) // no deja la cabecera huérfana
  })
})

describe("OrdenCompraService.createLineFromItem — cálculo de totales", () => {
  it("usa el nombre del item como descripción y aplica IVA 21 por defecto", async () => {
    itemSvc.getById.mockResolvedValue({ id: 9, nombre: "Cemento" } as never)
    repo.insertLinea.mockImplementation(async (l: never) => l)

    const linea: any = await OrdenCompraService.createLineFromItem(7, {
      item_id: 9,
      cantidad: 4,
      precio_unitario_neto: 10,
    })

    expect(linea).toMatchObject({
      orden_compra_id: 7,
      item_id: 9,
      descripcion: "Cemento",
      precio_unitario_neto: 10,
      cantidad: 4,
      iva_porcentaje: 21,
      total_neto: 40,
      total_con_iva: 48.4,
    })
    expect(linea).not.toHaveProperty("estado") // las líneas de OC ya no tienen estado
  })

  it("respeta precio, IVA y descripción explícitos", async () => {
    itemSvc.getById.mockResolvedValue({ id: 9, nombre: "Cemento" } as never)
    repo.insertLinea.mockImplementation(async (l: never) => l)

    const linea: any = await OrdenCompraService.createLineFromItem(7, {
      item_id: 9,
      cantidad: 2,
      precio_unitario_neto: 100,
      iva_porcentaje: 10,
      descripcion: "Especial",
    })

    expect(linea).toMatchObject({ descripcion: "Especial", precio_unitario_neto: 100, total_neto: 200, total_con_iva: 220 })
  })

  it("sin precio explícito lanza 422 (TODO F3: heredarlo del proveedor)", async () => {
    itemSvc.getById.mockResolvedValue({ id: 9, nombre: "Cemento" } as never)
    await expect(
      OrdenCompraService.createLineFromItem(7, { item_id: 9, cantidad: 4 })
    ).rejects.toMatchObject({ status: 422 })
  })

  it("lanza 404 si el item no existe", async () => {
    itemSvc.getById.mockResolvedValue(null)
    await expect(
      OrdenCompraService.createLineFromItem(7, { item_id: 99, cantidad: 1, precio_unitario_neto: 1 })
    ).rejects.toMatchObject({ status: 404 })
  })
})

describe("OrdenCompraService.updateLine — recálculo de totales", () => {
  it("recalcula totales cuando cambia la cantidad", async () => {
    repo.findLineaById.mockResolvedValue({ cantidad: 1, precio_unitario_neto: 100, iva_porcentaje: 21 })
    repo.updateLinea.mockImplementation(async (_id: number, u: never) => u)

    await OrdenCompraService.updateLine(3, { cantidad: 5 })

    expect(repo.updateLinea).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ cantidad: 5, total_neto: 500, total_con_iva: 605 })
    )
  })

  it("no recalcula (ni consulta la línea) si sólo cambia la descripción", async () => {
    repo.updateLinea.mockImplementation(async (_id: number, u: never) => u)
    await OrdenCompraService.updateLine(3, { descripcion: "nuevo" } as never)
    expect(repo.findLineaById).not.toHaveBeenCalled()
    expect(repo.updateLinea).toHaveBeenCalledWith(3, { descripcion: "nuevo" })
  })
})
