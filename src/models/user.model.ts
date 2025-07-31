export interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: UserRole
  estado: UserStatus
  ultimo_acceso?: Date
  created_at: Date
  updated_at: Date
}

export enum UserRole {
  ADMIN = "admin",
  USUARIO = "usuario",
  SUPERVISOR = "supervisor",
  READONLY = "readonly"
}

export enum UserStatus {
  ACTIVO = "activo",
  INACTIVO = "inactivo",
  SUSPENDIDO = "suspendido"
}

export interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: UserRole
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface CreateUserData {
  email: string
  password: string
  nombre: string
  apellido: string
  rol: UserRole
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  estado?: UserStatus
}
