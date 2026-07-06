import { describe, it, expect, vi, beforeEach } from "vitest"
import { CertificacionRepository } from "@/repositories/certificacion.repository"
import { CertificacionService } from "./certificacion.controller"

vi.mock("@/repositories/certificacion.repository", () => ({
  CertificacionRepository: {
    findLineasOCAprobadas: vi.fn(),
    findCertificadoByLineaOCIds: vi.fn(),
  },
}))

const repo = vi.mocked(CertificacionRepository)

beforeEach(() => vi.clearAllMocks())

describe("CertificacionService.getLineasOCDisponibles — saldo del 100%", () => {
  it("resta lo ya certificado (excluyendo rechazadas) del total de la línea de OC", async () => {
    repo.findLineasOCAprobadas.mockResolvedValue([
      {
        id: 10,
        descripcion: "Hormigón",
        cantidad: 100,
        precio_unitario_neto: 5,
        iva_porcentaje: 21,
        gu_ordenesdecompra: { id: 7, numero_oc: "OC-2026-001" },
      },
    ])
    // el repo ya filtró las rechazadas; suma 30 + 20 = 50
    repo.findCertificadoByLineaOCIds.mockResolvedValue([
      { linea_oc_id: 10, cantidad: 30, estado: "aprobado" },
      { linea_oc_id: 10, cantidad: 20, estado: "borrador" },
    ])

    const res = await CertificacionService.getLineasOCDisponibles(1)

    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({
      id: 10,
      numero_oc: "OC-2026-001",
      orden_compra_id: 7,
      cantidad: 100,
      cantidad_certificada: 50,
      cantidad_disponible: 50,
    })
  })

  it("sin líneas de OC aprobadas devuelve [] y no consulta el certificado", async () => {
    repo.findLineasOCAprobadas.mockResolvedValue([])
    const res = await CertificacionService.getLineasOCDisponibles(1)
    expect(res).toEqual([])
    expect(repo.findCertificadoByLineaOCIds).not.toHaveBeenCalled()
  })

  it("línea sin certificaciones previas: disponible = total", async () => {
    repo.findLineasOCAprobadas.mockResolvedValue([
      {
        id: 11,
        descripcion: "Acero",
        cantidad: 40,
        precio_unitario_neto: 2,
        iva_porcentaje: 21,
        gu_ordenesdecompra: { id: 8, numero_oc: "OC-2026-002" },
      },
    ])
    repo.findCertificadoByLineaOCIds.mockResolvedValue([])

    const res = await CertificacionService.getLineasOCDisponibles(1)

    expect(res[0].cantidad_certificada).toBe(0)
    expect(res[0].cantidad_disponible).toBe(40)
  })
})
