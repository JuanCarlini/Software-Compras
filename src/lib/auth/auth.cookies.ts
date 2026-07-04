import { cookies } from 'next/headers'
import { AuthService } from './auth.service'

const COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 días en segundos

/**
 * Establecer cookie de autenticación
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  })
}

/**
 * Obtener cookie de autenticación
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value
}

/**
 * Eliminar cookie de autenticación
 */
export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Obtener usuario actual desde la cookie
 */
export async function getCurrentUser() {
  try {
    const token = await getAuthCookie()
    
    if (!token) {
      return null
    }

    const payload = await AuthService.verifyToken(token)
    
    if (!payload) {
      await removeAuthCookie()
      return null
    }

    const user = await AuthService.getUserById(payload.userId)
    
    if (!user) {
      await removeAuthCookie()
      return null
    }

    return user
  } catch (error) {
    console.error('Error al obtener usuario actual:', error)
    return null
  }
}

/**
 * Verificar si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}
