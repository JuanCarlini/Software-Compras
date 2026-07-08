import { describe, it, expect, vi, beforeEach } from "vitest"
import { CertificacionRepository } from "@/repositories/certificacion.repository"
import { CertificacionService } from "./certificacion.controller"

vi.mock("@/repositories/certificacion.repository", () => ({
  CertificacionRepository: {
    findLineasOCAprobadas: vi.fn(),
    findLocRollupsByIds: vi.fn(),
  },
}))

const repo = vi.mocked(CertificacionRepository)

beforeEach(() => vi.clearAllMocks())

// El avance ya NO se acumula en JS: lo publica la vista v_loc_rollup (solo CE aprobadas).
// La regla del 100% la garantiza el trigger fn_check_avance_100; esto solo alimenta el form.
describe("CertificacionService.getLineasOCDisponibles — saldo leído de v_loc_rollup", () => {
  it("expone el avance y el disponible que devuelve la vista", async () => {
    repo.findLineasOCAprobadas.mockResolvedValue([
      {
        id: 10,
        numero_loc: "OC-00001.1",
        descripcion: "Hormigón",
        cantidad: 100,
        precio_unitario_neto: 5,
        iva_porcentaje: 21,
        gu_ordenesdecompra: { id: 7, numero_oc: "OC-00001" },
      },
    ])
    repo.findLocRollupsByIds.mockResolvedValue([
      {
        linea_oc_id: 10,
        orden_compra_id: 7,
        cantidad: 100,
        unidades_certificadas: 60,
        unidades_pendientes: 40,
        monto_pendiente: 200,
        estado_certificacion: "parcial",
      },
    ])

    const res = await CertificacionService.getLineasOCDisponibles(1)

    expect(repo.findLocRollupsByIds).toHaveBeenCalledWith([10])
    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({
      id: 10,
      numero_loc: "OC-00001.1",
      numero_oc: "OC-00001",
      orden_compra_id: 7,
      cantidad: 100,
      cantidad_certificada: 60,
      cantidad_disponible: 40,
      estado_certificacion: "parcial",
    })
  })

  it("sin líneas de OC aprobadas devuelve [] y no consulta la vista", async () => {
    repo.findLineasOCAprobadas.mockResolvedValue([])
    const res = await CertificacionService.getLineasOCDisponibles(1)
    expect(res).toEqual([])
    expect(repo.findLocRollupsByIds).not.toHaveBeenCalled()
  })

  it("línea sin fila en la vista: disponible = cantidad total, estado 'sin'", async () => {
    repo.findLineasOCAprobadas.mockResolvedValue([
      {
        id: 11,
        numero_loc: "OC-00002.1",
        descripcion: "Acero",
        cantidad: 40,
        precio_unitario_neto: 2,
        iva_porcentaje: 21,
        gu_ordenesdecompra: { id: 8, numero_oc: "OC-00002" },
      },
    ])
    repo.findLocRollupsByIds.mockResolvedValue([])

    const res = await CertificacionService.getLineasOCDisponibles(1)

    expect(res[0].cantidad_certificada).toBe(0)
    expect(res[0].cantidad_disponible).toBe(40)
    expect(res[0].estado_certificacion).toBe("sin")
  })
})
