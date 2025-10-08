import { 
  User, 
  AuthUser, 
  LoginCredentials, 
  CreateUserData,
  UpdateUserData,
  UserRole,
  UserStatus
} from "@/models"
import { AuthenticationError, ValidationError } from "@/shared/errors"

// TODO: Reemplazar con conexión a base de datos real
// Credenciales temporales para desarrollo (eliminar al conectar BD)
const validCredentials = {
  "admin@gestion.com": {
    password: "admin123",
    user: {
      id: "1",
      email: "admin@gestion.com",
      nombre: "Administrador",
      apellido: "Sistema",
      rol: UserRole.ADMIN,
      estado: UserStatus.ACTIVO,
      created_at: new Date("2024-01-01"),
      updated_at: new Date("2024-01-01")
    }
  }
} as const

// Array de usuarios para otros métodos
const users: User[] = Object.values(validCredentials).map(cred => cred.user)

export class AuthController {
  static async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Validación básica de input
    if (!credentials.email || !credentials.password) {
      throw new ValidationError("Email y contraseña son requeridos")
    }

    if (!credentials.email.includes("@")) {
      throw new ValidationError("Formato de email inválido")
    }

    // Verificación de credenciales reales
    const userCredential = validCredentials[credentials.email as keyof typeof validCredentials]
    
    if (!userCredential || userCredential.password !== credentials.password) {
      throw new AuthenticationError("Credenciales inválidas")
    }

    // Verificar que el usuario esté activo
    if (userCredential.user.estado !== UserStatus.ACTIVO) {
      throw new AuthenticationError("Usuario inactivo")
    }

    const authUser: AuthUser = {
      id: userCredential.user.id,
      email: userCredential.user.email,
      nombre: userCredential.user.nombre,
      rol: userCredential.user.rol
    }

    return authUser
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    // TODO: Implementar validación de token JWT real
    // Por ahora devuelve usuario admin por defecto
    return {
      id: "1",
      email: "admin@gestion.com", 
      nombre: "Administrador",
      rol: UserRole.ADMIN
    }
  }

  static async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    // TODO: Invalidar token JWT
  }

  static async validateToken(token: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    // TODO: Validar token JWT real
    return token.length > 0
  }
}

export class UserController {
  static async getAll(): Promise<User[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return users
  }

  static async getById(id: string): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return users.find(user => user.id === id) || null
  }

  static async create(data: CreateUserData): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newId = (users.length + 1).toString()
    const newUser: User = {
      id: newId,
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol,
      estado: UserStatus.ACTIVO,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    users.push(newUser)
    return newUser
  }

  static async update(id: string, data: UpdateUserData): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const index = users.findIndex(user => user.id === id)
    if (index === -1) return null
    
    users[index] = {
      ...users[index],
      ...data,
      updated_at: new Date()
    }
    
    return users[index]
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = users.findIndex(user => user.id === id)
    if (index === -1) return false
    
    users.splice(index, 1)
    return true
  }
}
