/**
 * Invalidación de sesiones al cambiar la credencial (CN-009).
 *
 * El JWT es stateless y no lleva versión de credencial, así que un token emitido antes de
 * un cambio de clave seguía siendo válido los 7 días completos: cambiarle la contraseña a
 * una cuenta comprometida NO expulsaba al atacante.
 *
 * En vez de agregar una columna `token_version` (migración + confirmación), se comparan dos
 * datos que YA existen: el `iat` que jsonwebtoken pone en todo token, y el `updated_at` de
 * gu_usuario, que `changePassword` y `resetPassword` ya actualizan.
 *
 * ponytail: el precio es que CUALQUIER update de la fila invalida las sesiones, no solo el
 * de la clave. Para el cambio de rol eso es deseable (hoy el rol viaja dentro del JWT y
 * queda stale hasta que expira); para un cambio de nombre es una molestia menor y rara.
 * Si algún día ese ruido importa, el upgrade es la columna `token_version` dedicada.
 */

// `iat` se trunca a segundos, así que puede quedar hasta 1s por detrás de un `updated_at`
// del mismo instante. Sin este margen, un login simultáneo a un update se auto-invalidaría.
const TOLERANCIA_MS = 1000

export function tokenQuedoObsoleto(
  iatSegundos: number | undefined,
  updatedAt: string | null | undefined
): boolean {
  // Fail-closed: jsonwebtoken siempre emite `iat`. Un token sin él está armado a mano, y
  // omitirlo sería exactamente la forma de esquivar este chequeo.
  if (iatSegundos === undefined || iatSegundos === null) return true

  if (!updatedAt) return false // sin dato no se puede decidir: no invalidar

  const actualizado = Date.parse(updatedAt)
  if (Number.isNaN(actualizado)) return false // dato corrupto: no romper el login

  return actualizado > iatSegundos * 1000 + TOLERANCIA_MS
}
