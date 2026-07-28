// Rate-limiting de intentos de login (mitigación de fuerza bruta).
//
// Contador en memoria por instancia. En Vercel serverless cada lambda tiene
// su propio Map, así que NO es un límite global entre instancias — es best-effort contra
// fuerza bruta rápida desde una conexión caliente. Alcanza como baseline y no agrega
// dependencias ni infra. Upgrade cuando haga falta un límite compartido y persistente:
// @upstash/ratelimit + Vercel KV (Redis), misma interfaz.

type Intentos = { count: number; resetAt: number }

const MAX_INTENTOS = 5
const VENTANA_MS = 15 * 60 * 1000 // 15 minutos

const store = new Map<string, Intentos>()

/** ¿La clave está bloqueada ahora? No muta nada. */
export function estaBloqueado(key: string, now: number): { bloqueado: boolean; retryAfterSec: number } {
  const rec = store.get(key)
  if (!rec || now > rec.resetAt) return { bloqueado: false, retryAfterSec: 0 }
  if (rec.count >= MAX_INTENTOS) {
    return { bloqueado: true, retryAfterSec: Math.ceil((rec.resetAt - now) / 1000) }
  }
  return { bloqueado: false, retryAfterSec: 0 }
}

/** Registra un intento fallido; abre o extiende la ventana. */
export function registrarFallo(key: string, now: number): void {
  const rec = store.get(key)
  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + VENTANA_MS })
  } else {
    rec.count++
  }
}

/** Login exitoso: limpia el contador de la clave. */
export function limpiarIntentos(key: string): void {
  store.delete(key)
}

/**
 * IP del cliente, resistente al spoofing de `X-Forwarded-For`.
 *
 * El error clásico es tomar el PRIMER elemento del XFF: esa es la parte que pone el
 * cliente — cada proxy AGREGA su valor observado al final, no reemplaza el principio.
 * Rotando el header, un atacante obtenía una clave de rate-limit nueva por intento y el
 * bloqueo no se disparaba nunca.
 *
 * `x-real-ip` lo setea la plataforma (Vercel) y el cliente no puede falsificarlo, así que
 * va primero. Como fallback, el último salto del XFF, que es el que agregó el proxy de
 * confianza más cercano.
 */
export function resolverIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim()
  if (real) return real

  const saltos = headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
  return saltos[saltos.length - 1] || "unknown"
}

/**
 * Las dos claves de rate-limit de un intento de login.
 *
 * `porIpEmail` es best-effort (la IP se puede rotar). `porEmail` es la que de verdad frena
 * la fuerza bruta contra una cuenta concreta, porque no depende de ningún header.
 * El costo es que un atacante puede bloquear la cuenta de un tercero a propósito
 * (DoS de login). Aceptable acá — la ventana son 15 minutos y el alta de usuarios es por
 * admin. Si molestara, el upgrade es el mismo de siempre: contador compartido en KV con
 * desbloqueo por email al dueño de la cuenta.
 */
export function clavesDeLogin(ip: string, email: string): { porEmail: string; porIpEmail: string } {
  const normalizado = String(email).toLowerCase()
  return { porEmail: `email:${normalizado}`, porIpEmail: `${ip}:${normalizado}` }
}
