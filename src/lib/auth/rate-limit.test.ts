import { describe, it, expect } from "vitest"
import { estaBloqueado, registrarFallo, limpiarIntentos } from "./rate-limit"

// El store del limiter es module-level; cada test usa una clave única para aislarse.
describe("rate-limit de login (S3)", () => {
  const now = 1_000_000

  it("deja pasar los primeros 5 intentos y bloquea el 6º", () => {
    const key = "ip1:user@a.com"
    for (let i = 0; i < 5; i++) {
      expect(estaBloqueado(key, now).bloqueado).toBe(false)
      registrarFallo(key, now)
    }
    const r = estaBloqueado(key, now)
    expect(r.bloqueado).toBe(true)
    expect(r.retryAfterSec).toBeGreaterThan(0)
  })

  it("un login exitoso limpia el contador", () => {
    const key = "ip2:user@a.com"
    for (let i = 0; i < 5; i++) registrarFallo(key, now)
    expect(estaBloqueado(key, now).bloqueado).toBe(true)
    limpiarIntentos(key)
    expect(estaBloqueado(key, now).bloqueado).toBe(false)
  })

  it("la ventana expira: pasados 15 min el bloqueo se levanta", () => {
    const key = "ip3:user@a.com"
    for (let i = 0; i < 5; i++) registrarFallo(key, now)
    expect(estaBloqueado(key, now).bloqueado).toBe(true)
    const despues = now + 15 * 60 * 1000 + 1
    expect(estaBloqueado(key, despues).bloqueado).toBe(false)
  })

  it("claves distintas (otro IP/email) no se afectan entre sí", () => {
    const a = "ipA:x@a.com"
    const b = "ipB:x@a.com"
    for (let i = 0; i < 5; i++) registrarFallo(a, now)
    expect(estaBloqueado(a, now).bloqueado).toBe(true)
    expect(estaBloqueado(b, now).bloqueado).toBe(false)
  })
})
