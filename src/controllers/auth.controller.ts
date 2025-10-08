import { createClient } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export class AuthController {
  static async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })
    
    if (error || !data.user) return null
    
    return {
      id: data.user.id,
      email: data.user.email!,
      nombre: data.user.user_metadata?.nombre || 'Usuario',
      rol: data.user.user_metadata?.rol || 'usuario'
    }
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null
    
    return {
      id: user.id,
      email: user.email!,
      nombre: user.user_metadata?.nombre || 'Usuario',
      rol: user.user_metadata?.rol || 'usuario'
    }
  }

  static async logout(): Promise<void> {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  static async signup(email: string, password: string, metadata: any) {
    const supabase = createClient()
    
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  }
}
