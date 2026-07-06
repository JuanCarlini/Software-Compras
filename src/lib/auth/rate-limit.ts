// Rate-limiting de intentos de login (S3: mitigación de fuerza bruta).
//
// ponytail: contador en memoria por instancia. En Vercel serverless cada lambda tiene
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
