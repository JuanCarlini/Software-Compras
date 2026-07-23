// Fuente única del secreto de firma JWT, con validación de fuerza mínima.
//
// Por qué existe: un JWT_SECRET adivinable anula TODA la cadena de autorización —
// middleware, requireAuth, requirePermission y las guardas de página confían en la firma.
// El secreto anterior (rotado el 2026-07-23) eran 36 caracteres de palabras de diccionario
// unidas por guiones, con el nombre público del proyecto adentro: crackeable offline con un
// wordlist dirigido de pocos miles de combinaciones.
//
// Se lee en tiempo de request, NO al importar el módulo: un throw a nivel de módulo rompe
// el "Collecting page data" de `next build` (Next importa cada ruta).

const LONGITUD_MINIMA = 32

// ponytail: heurístico deliberado, no un medidor de entropía. Atrapa los dos casos reales
// (placeholders y secretos derivados del nombre del proyecto) sin falsos positivos sobre
// hex o base64 aleatorios. NO detecta una frase larga de diccionario arbitraria: para eso
// haría falta un diccionario embebido, que no justifica su costo acá. La defensa de fondo
// es generar el secreto con `crypto.randomBytes(32)`, no adivinar si el humano lo hizo.
const PALABRAS_PREVISIBLES = /gestion|soma|changeme|password|clave|secreto|supersecret|example|placeholder/i

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error(
      "JWT_SECRET no está configurada. Definila en .env.local / variables de entorno del deploy."
    )
  }

  if (secret.length < LONGITUD_MINIMA) {
    throw new Error(
      `JWT_SECRET debe tener al menos ${LONGITUD_MINIMA} caracteres. ` +
        `Generá uno con: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
    )
  }

  if (PALABRAS_PREVISIBLES.test(secret)) {
    throw new Error(
      "JWT_SECRET contiene una palabra previsible (nombre del proyecto o placeholder). " +
        `Generá uno aleatorio con: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
    )
  }

  return secret
}
