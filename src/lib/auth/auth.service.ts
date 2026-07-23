import { BCRYPT_ROUNDS } from "@/shared/validation/password-validation"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@/lib/supabase/service'
import { getJwtSecret } from '@/lib/auth/jwt-secret'

const JWT_EXPIRES_IN = '7d'

// El join gu_roles(nombre) es many-to-one: en runtime llega como objeto,
// pero el cliente sin tipar lo infiere como array
function rolNombreDe(gu_roles: unknown): string | undefined {
  return (gu_roles as { nombre?: string } | null)?.nombre
}

export interface AuthUser {
  id: number
  email: string
  nombre: string
  rol_id: number
  rol_nombre?: string
  estado: 'activo' | 'inactivo'
  // Marca de última modificación de la fila. La usa getCurrentUser para invalidar tokens
  // emitidos antes de un cambio de credencial (CN-009, ver session-freshness.ts).
  updated_at?: string | null
}

export interface JWTPayload {
  userId: number
  email: string
  nombre: string
  rolId: number
  rolNombre?: string
  // Claim estándar que jsonwebtoken agrega al firmar y devuelve al verificar. Se declara
  // para poder compararlo con gu_usuario.updated_at (CN-009); nunca se setea a mano.
  iat?: number
}

export class AuthService {
  /**
   * Autenticar usuario con email y contraseña
   */
  static async login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    try {
      const supabase = createClient()

      // Buscar usuario por email con su rol
      const { data: usuario, error } = await supabase
        .from('gu_usuario')
        .select(`
          id,
          email,
          nombre,
          password_hash,
          rol_id,
          estado,
          gu_roles (
            nombre
          )
        `)
        .eq('email', email)
        .eq('estado', 'activo')
        .single()

      if (error || !usuario) {
        console.error('Usuario no encontrado:', error)
        return null
      }

      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(password, usuario.password_hash)

      if (!passwordMatch) {
        console.error('Contraseña incorrecta')
        return null
      }

      // Crear token JWT
      const payload: JWTPayload = {
        userId: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rolId: usuario.rol_id,
        rolNombre: rolNombreDe(usuario.gu_roles)
      }

      const token = jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN })

      // Retornar usuario y token
      return {
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol_id: usuario.rol_id,
          rol_nombre: rolNombreDe(usuario.gu_roles),
          // gu_usuario.estado es nullable en la DB; la query ya filtró por 'activo',
          // pero si alguna vez llega NULL, fail-closed.
          estado: usuario.estado ?? 'inactivo'
        },
        token
      }
    } catch (error) {
      console.error('Error en login:', error)
      return null
    }
  }

  /**
   * Emite un token nuevo para un usuario ya autenticado.
   *
   * Lo usa el cambio de clave propio: como la invalidación por `updated_at` (CN-009) mata
   * TODAS las sesiones anteriores —incluida la del que está cambiando su propia clave—,
   * hay que devolverle una cookie fresca. El efecto neto es el deseado: el usuario sigue
   * trabajando y cualquier otra sesión (la del atacante) queda muerta.
   */
  static emitirToken(user: AuthUser): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      rolId: user.rol_id,
      rolNombre: user.rol_nombre,
    }
    return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN })
  }

  /**
   * Verificar token JWT
   */
  static async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload
      return decoded
    } catch (error) {
      console.error('Error al verificar token:', error)
      return null
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getUserById(userId: number): Promise<AuthUser | null> {
    try {
      const supabase = createClient()

      const { data: usuario, error } = await supabase
        .from('gu_usuario')
        .select(`
          id,
          email,
          nombre,
          rol_id,
          estado,
          updated_at,
          gu_roles (
            nombre
          )
        `)
        .eq('id', userId)
        .eq('estado', 'activo')
        .single()

      if (error || !usuario) {
        return null
      }

      return {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol_id: usuario.rol_id,
        rol_nombre: rolNombreDe(usuario.gu_roles),
        estado: usuario.estado ?? 'inactivo',
        updated_at: usuario.updated_at
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      return null
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      const supabase = createClient()

      // Obtener usuario actual
      const { data: usuario, error } = await supabase
        .from('gu_usuario')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (error || !usuario) {
        return false
      }

      // Verificar contraseña actual
      const passwordMatch = await bcrypt.compare(oldPassword, usuario.password_hash)

      if (!passwordMatch) {
        return false
      }

      // Hashear nueva contraseña
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

      // Actualizar contraseña
      const { error: updateError } = await supabase
        .from('gu_usuario')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return !updateError
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      return false
    }
  }
}
