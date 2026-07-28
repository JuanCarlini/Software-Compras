import { z } from "zod"

// Política de contraseñas, en un solo lugar. Antes la regla `length >= 6` estaba
// duplicada inline en las 3 rutas que tocan claves: alta por admin, reset por admin y
// cambio propio — con lo cual "la política" era en realidad tres copias que podían
// divergir, y ninguna tenía máximo.
//
// El máximo NO es cosmético: bcrypt trunca la entrada en 72 bytes SIN AVISAR, así que dos
// claves distintas que comparten los primeros 72 bytes son la misma clave para el sistema.
// Mejor rechazarlas que aceptarlas dando una falsa sensación de fortaleza.
const MIN_CARACTERES = 12
const MAX_BYTES = 72

// Solo longitud, sin reglas de composición (mayúscula + símbolo + dígito).
// Es lo que recomienda el NIST SP 800-63B desde 2017: las reglas de composición empujan a
// patrones predecibles ("Password1!") sin agregar entropía real, mientras que la longitud
// sí. Si alguna vez se exige composición por normativa, se suma acá y solo acá.
export const PasswordSchema = z
  .string({ required_error: "La contraseña es requerida", invalid_type_error: "La contraseña debe ser texto" })
  .min(MIN_CARACTERES, `La contraseña debe tener al menos ${MIN_CARACTERES} caracteres`)
  .refine((v) => new TextEncoder().encode(v).length <= MAX_BYTES, {
    message: `La contraseña no puede superar los ${MAX_BYTES} bytes (bcrypt trunca a partir de ahí)`,
  })

/**
 * Costo de bcrypt. Era 10 (~50-100 ms), por debajo del 12 que recomienda OWASP hoy.
 * Subirlo es retrocompatible: bcrypt guarda el costo DENTRO del hash, así que los hashes
 * viejos se siguen verificando bien — solo los nuevos usan el costo nuevo.
 */
export const BCRYPT_ROUNDS = 12
