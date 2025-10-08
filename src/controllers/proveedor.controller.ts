import { 
  Proveedor, 
  CreateProveedorData, 
  UpdateProveedorData,
  EstadoProveedor 
} from "@/models"
import { NotFoundError, ValidationError, ConflictError } from "@/shared/errors"

// TODO: Conectar con base de datos real
// const prisma = new PrismaClient()

// Almacenamiento temporal en memoria (se perderá al reiniciar)
// TODO: Reemplazar con conexión a base de datos real
let proveedoresTemporales: Proveedor[] = []
let nextId = 1

export class ProveedorController {
  static async getAll(): Promise<Proveedor[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // TODO: Reemplazar con query real
    // return await prisma.proveedor.findMany({
    //   where: { deleted_at: null },
    //   orderBy: { created_at: 'desc' }
    // })
    
    return proveedoresTemporales
  }

  static async getById(id: string): Promise<Proveedor | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // TODO: Reemplazar con query real
    // return await prisma.proveedor.findUnique({
    //   where: { id, deleted_at: null }
    // })
    
    return proveedoresTemporales.find(p => p.id === id) || null
  }

  static async create(data: CreateProveedorData): Promise<Proveedor> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Validaciones de negocio
    if (!data.nombre || data.nombre.trim().length < 2) {
      throw new ValidationError("Nombre debe tener al menos 2 caracteres", "nombre")
    }

    if (!data.rut || data.rut.length < 8) {
      throw new ValidationError("RUT debe tener al menos 8 caracteres", "rut")
    }

    if (!data.email.includes("@")) {
      throw new ValidationError("Email inválido", "email")
    }

    // Verificar RUT y email únicos en memoria
    const existingRut = proveedoresTemporales.find(p => p.rut === data.rut)
    if (existingRut) {
      throw new ConflictError("Ya existe un proveedor con ese RUT")
    }

    const existingEmail = proveedoresTemporales.find(p => p.email === data.email)
    if (existingEmail) {
      throw new ConflictError("Ya existe un proveedor con ese email")
    }
    
    // Crear proveedor temporal
    const nuevoProveedor: Proveedor = {
      id: String(nextId++),
      ...data,
      estado: EstadoProveedor.ACTIVO,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    proveedoresTemporales.push(nuevoProveedor)
    return nuevoProveedor
  }

  static async update(id: string, data: UpdateProveedorData): Promise<Proveedor | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Validaciones
    if (data.email && !data.email.includes("@")) {
      throw new ValidationError("Email inválido", "email")
    }

    if (data.rut && data.rut.length < 8) {
      throw new ValidationError("RUT debe tener al menos 8 caracteres", "rut")
    }
    
    const index = proveedoresTemporales.findIndex(p => p.id === id)
    if (index === -1) {
      throw new NotFoundError("Proveedor no encontrado")
    }
    
    proveedoresTemporales[index] = {
      ...proveedoresTemporales[index],
      ...data,
      updated_at: new Date()
    }
    
    return proveedoresTemporales[index]
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = proveedoresTemporales.findIndex(p => p.id === id)
    if (index === -1) {
      return false
    }
    
    proveedoresTemporales.splice(index, 1)
    return true
  }

  static async activar(id: string): Promise<Proveedor | null> {
    return this.update(id, { estado: EstadoProveedor.ACTIVO })
  }

  static async suspender(id: string): Promise<Proveedor | null> {
    return this.update(id, { estado: EstadoProveedor.SUSPENDIDO })
  }

  static async getActivos(): Promise<Proveedor[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return proveedoresTemporales.filter(p => p.estado === EstadoProveedor.ACTIVO)
  }

  static async buscarPorRut(rut: string): Promise<Proveedor | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return proveedoresTemporales.find(p => p.rut === rut) || null
  }

  static async getEstadisticas(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const activos = proveedoresTemporales.filter(p => p.estado === EstadoProveedor.ACTIVO).length
    const suspendidos = proveedoresTemporales.filter(p => p.estado === EstadoProveedor.SUSPENDIDO).length
    const inactivos = proveedoresTemporales.filter(p => p.estado === EstadoProveedor.INACTIVO).length
    
    return {
      total: proveedoresTemporales.length,
      activos,
      suspendidos,
      inactivos
    }
  }
}
