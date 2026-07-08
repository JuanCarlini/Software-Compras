import { describe, it, expect } from "vitest"
import { totalesDeLinea, totalesDeCabecera } from "./totales"

describe("totalesDeLinea", () => {
  it("calcula neto y con IVA", () => {
    expect(totalesDeLinea(10, 9500, 21)).toEqual({ total_neto: 95000, total_con_iva: 114950 })
  })

  it("IVA 0 deja neto = con IVA", () => {
    expect(totalesDeLinea(3, 100, 0)).toEqual({ total_neto: 300, total_con_iva: 300 })
  })

  it("redondea a 2 decimales (evita 0.30000000000000004)", () => {
    expect(totalesDeLinea(3, 0.1, 0).total_neto).toBe(0.3)
  })
})

describe("totalesDeCabecera", () => {
  it("suma líneas y deriva el IVA como con_iva - neto", () => {
    // línea 1: 95000 neto + 21% = 114950 (IVA 19950). línea 2: exenta.
    expect(
      totalesDeCabecera([
        { total_neto: 95000, total_con_iva: 114950 },
        { total_neto: 5000, total_con_iva: 5000 },
      ])
    ).toEqual({ total_neto: 100000, total_iva: 19950, total_con_iva: 119950 })
  })

  it("sin líneas devuelve ceros", () => {
    expect(totalesDeCabecera([])).toEqual({ total_neto: 0, total_iva: 0, total_con_iva: 0 })
  })

  it("tolera los numeric de Postgres que llegan como string", () => {
    expect(
      totalesDeCabecera([{ total_neto: "1000.00", total_con_iva: "1210.00" } as never])
    ).toEqual({ total_neto: 1000, total_iva: 210, total_con_iva: 1210 })
  })
})
