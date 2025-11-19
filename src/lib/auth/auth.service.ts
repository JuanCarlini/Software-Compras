import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@/lib/supabase/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: number
  email: string
  nombre: string
  rol_id: number
  rol_nombre?: string
  estado: 'activo' | 'inactivo'
}

export interface JWTPayload {
  userId: number
  email: string
  nombre: string
  rolId: number
  rolNombre?: string
}

export class AuthService {
  /**
   * Autenticar usuario con email y contraseña
   */
  static async login(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    try {
      const supabase = await createClient()
      
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
        rolNombre: usuario.gu_roles?.nombre
      }

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

      // Retornar usuario y token
      return {
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol_id: usuario.rol_id,
          rol_nombre: usuario.gu_roles?.nombre,
          estado: usuario.estado
        },
        token
      }
    } catch (error) {
      console.error('Error en login:', error)
      return null
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async signup(
    email: string,
    password: string,
    nombre: string,
    rolId: number = 2 // Por defecto rol "usuario"
  ): Promise<{ user: AuthUser; token: string } | null> {
    try {
      const supabase = await createClient()

      // Verificar si el email ya existe
      const { data: existingUser } = await supabase
        .from('gu_usuario')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        throw new Error('El email ya está registrado')
      }

      // Hashear contraseña
      const passwordHash = await bcrypt.hash(password, 10)

      // Crear usuario
      const { data: nuevoUsuario, error } = await supabase
        .from('gu_usuario')
        .insert({
          email,
          nombre,
          password_hash: passwordHash,
          rol_id: rolId,
          estado: 'activo'
        })
        .select(`
          id,
          email,
          nombre,
          rol_id,
          estado,
          gu_roles (
            nombre
          )
        `)
        .single()

      if (error || !nuevoUsuario) {
        console.error('Error al crear usuario:', error)
        return null
      }

      // Crear token JWT
      const payload: JWTPayload = {
        userId: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rolId: nuevoUsuario.rol_id,
        rolNombre: nuevoUsuario.gu_roles?.nombre
      }

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

      return {
        user: {
          id: nuevoUsuario.id,
          email: nuevoUsuario.email,
          nombre: nuevoUsuario.nombre,
          rol_id: nuevoUsuario.rol_id,
          rol_nombre: nuevoUsuario.gu_roles?.nombre,
          estado: nuevoUsuario.estado
        },
        token
      }
    } catch (error) {
      console.error('Error en signup:', error)
      return null
    }
  }

  /**
   * Verificar token JWT
   */
  static async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
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
      const supabase = await createClient()
      
      const { data: usuario, error } = await supabase
        .from('gu_usuario')
        .select(`
          id,
          email,
          nombre,
          rol_id,
          estado,
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
        rol_nombre: usuario.gu_roles?.nombre,
        estado: usuario.estado
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
      const supabase = await createClient()
      
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
      const newPasswordHash = await bcrypt.hash(newPassword, 10)

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
