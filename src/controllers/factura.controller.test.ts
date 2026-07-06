import { describe, it, expect, vi, beforeEach } from "vitest"
import { FacturaRepository } from "@/repositories/factura.repository"
import { FacturaService } from "./factura.controller"

vi.mock("@/repositories/factura.repository", () => ({
  FacturaRepository: {
    findAllWithProveedor: vi.fn(),
    findByIdWithProveedor: vi.fn(),
    findLineasByFacturaId: vi.fn(),
    findCertificacionesByFacturaId: vi.fn(),
    findCertificacionesAprobadas: vi.fn(),
    findLastNumero: vi.fn(),
    insert: vi.fn(),
    insertLineas: vi.fn(),
    insertCertificacionRelations: vi.fn(),
    deleteCertificacionRelations: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
  },
}))

const repo = vi.mocked(FacturaRepository)
const year = new Date().getFullYear()

beforeEach(() => {
  vi.clearAllMocks()
  repo.insert.mockResolvedValue({ id: 1, numero_factura: "X" })
  repo.insertLineas.mockResolvedValue(undefined)
  repo.insertCertificacionRelations.mockResolvedValue(undefined)
  repo.deleteCertificacionRelations.mockResolvedValue(undefined)
})

describe("FacturaService.create — numeración, estado y relaciones", () => {
  it("primera factura del año: FACT-<año>-001 y estado 'borrador'", async () => {
    repo.findLastNumero.mockResolvedValue(null)
    await FacturaService.create({ proveedor_id: 1, fecha_factura: "2026-01-01", total_neto: 100 })
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ numero_factura: `FACT-${year}-001`, estado: "borrador" })
    )
  })

  it("fuerza estado 'borrador' aunque el cliente mande 'aprobado' (S2 — bypass de workflow)", async () => {
    repo.findLastNumero.mockResolvedValue(null)
    await FacturaService.create({ proveedor_id: 1, fecha_factura: "2026-01-01", estado: "aprobado" })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ estado: "borrador" }))
  })

  it("incrementa el correlativo dentro del mismo año", async () => {
    repo.findLastNumero.mockResolvedValue(`FACT-${year}-012`)
    await FacturaService.create({ proveedor_id: 1, fecha_factura: "x" })
    expect(repo.insert).toHaveBeenCalledWith(expect.objectContaining({ numero_factura: `FACT-${year}-013` }))
  })

  it("asocia líneas y certificaciones al id de la factura creada", async () => {
    repo.findLastNumero.mockResolvedValue(null)
    repo.insert.mockResolvedValue({ id: 77, numero_factura: `FACT-${year}-001` })
    await FacturaService.create({
      proveedor_id: 1,
      fecha_factura: "x",
      lineas: [{ descripcion: "item", cantidad: 1, total_neto: 100 }],
      certificaciones_ids: [3, 4],
    })
    expect(repo.insertLineas).toHaveBeenCalledWith([
      expect.objectContaining({ factura_id: 77, descripcion: "item" }),
    ])
    expect(repo.insertCertificacionRelations).toHaveBeenCalledWith([
      { factura_id: 77, certificacion_id: 3 },
      { factura_id: 77, certificacion_id: 4 },
    ])
  })
})

describe("FacturaService.update — relaciones de certificaciones", () => {
  it("devuelve null si la factura no existe (no toca relaciones)", async () => {
    repo.update.mockResolvedValue(null)
    const res = await FacturaService.update(1, { certificaciones_ids: [1] })
    expect(res).toBeNull()
    expect(repo.deleteCertificacionRelations).not.toHaveBeenCalled()
  })

  it("reemplaza las certificaciones cuando se proporcionan", async () => {
    repo.update.mockResolvedValue({ id: 1 })
    await FacturaService.update(1, { total_neto: 50, certificaciones_ids: [9] })
    expect(repo.deleteCertificacionRelations).toHaveBeenCalledWith(1)
    expect(repo.insertCertificacionRelations).toHaveBeenCalledWith([{ factura_id: 1, certificacion_id: 9 }])
  })

  it("no toca relaciones si no se pasan certificaciones_ids", async () => {
    repo.update.mockResolvedValue({ id: 1 })
    await FacturaService.update(1, { total_neto: 50 })
    expect(repo.deleteCertificacionRelations).not.toHaveBeenCalled()
    expect(repo.insertCertificacionRelations).not.toHaveBeenCalled()
  })
})

describe("FacturaService.getById — ensamblado de joins", () => {
  it("aplana proveedor y mapea las certificaciones del puente N:M", async () => {
    repo.findByIdWithProveedor.mockResolvedValue({
      id: 1,
      gu_proveedores: { nombre: "Prov", cuit: "20-1", email: "e", direccion: "d" },
    })
    repo.findLineasByFacturaId.mockResolvedValue([{ id: 1 }])
    repo.findCertificacionesByFacturaId.mockResolvedValue([
      { certificacion_id: 5, gu_certificaciones: { id: 5, numero_cert: "CERT-1" } },
    ])

    const res: any = await FacturaService.getById(1)

    expect(res.proveedor_nombre).toBe("Prov")
    expect(res.proveedor_cuit).toBe("20-1")
    expect(res.lineas).toHaveLength(1)
    expect(res.certificaciones).toEqual([{ id: 5, numero_cert: "CERT-1" }])
  })

  it("devuelve null si la factura no existe", async () => {
    repo.findByIdWithProveedor.mockResolvedValue(null)
    expect(await FacturaService.getById(9)).toBeNull()
  })
})
