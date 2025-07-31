import { 
  User, 
  AuthUser, 
  LoginCredentials, 
  CreateUserData,
  UpdateUserData,
  UserRole,
  UserStatus
} from "@/models"

// Usuarios mock
const users: User[] = [
  {
    id: "1",
    email: "admin@gestion.com",
    nombre: "Admin",
    apellido: "Sistema",
    rol: UserRole.ADMIN,
    estado: UserStatus.ACTIVO,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01")
  }
]

export class AuthController {
  static async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulación: cualquier email válido es aceptado
    if (credentials.email && credentials.password) {
      const user: AuthUser = {
        id: "1",
        email: credentials.email,
        nombre: "Usuario",
        rol: UserRole.ADMIN
      }
      return user
    }
    
    return null
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    // Simulación: devolver usuario admin por defecto
    return {
      id: "1",
      email: "admin@gestion.com", 
      nombre: "Admin",
      rol: UserRole.ADMIN
    }
  }

  static async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    // Limpiar sesión
  }

  static async validateToken(token: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    // Validar token JWT
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
