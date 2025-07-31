import { 
  Proveedor, 
  CreateProveedorData, 
  UpdateProveedorData,
  EstadoProveedor 
} from "@/models"

// Datos mock de proveedores
const proveedores: Proveedor[] = [
  {
    id: "1",
    nombre: "ABC Corporation",
    rut: "12345678-9",
    email: "contacto@abc.com",
    telefono: "+54 11 1234-5678",
    direccion: "Av. Corrientes 1234",
    ciudad: "Buenos Aires",
    pais: "Argentina",
    estado: EstadoProveedor.ACTIVO,
    contacto_principal: "Juan Pérez",
    sitio_web: "https://abc.com",
    created_at: new Date("2024-01-15"),
    updated_at: new Date("2024-01-15")
  },
  {
    id: "2", 
    nombre: "XYZ Supplies Ltd",
    rut: "87654321-0",
    email: "ventas@xyz.com",
    telefono: "+54 11 8765-4321",
    direccion: "San Martín 567",
    ciudad: "Córdoba", 
    pais: "Argentina",
    estado: EstadoProveedor.ACTIVO,
    contacto_principal: "María García",
    created_at: new Date("2024-01-10"),
    updated_at: new Date("2024-01-10")
  }
]

export class ProveedorController {
  static async getAll(): Promise<Proveedor[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return proveedores
  }

  static async getById(id: string): Promise<Proveedor | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return proveedores.find(proveedor => proveedor.id === id) || null
  }

  static async create(data: CreateProveedorData): Promise<Proveedor> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newId = (proveedores.length + 1).toString()
    const newProveedor: Proveedor = {
      id: newId,
      ...data,
      estado: EstadoProveedor.ACTIVO,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    proveedores.push(newProveedor)
    return newProveedor
  }

  static async update(id: string, data: UpdateProveedorData): Promise<Proveedor | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const index = proveedores.findIndex(proveedor => proveedor.id === id)
    if (index === -1) return null
    
    proveedores[index] = {
      ...proveedores[index],
      ...data,
      updated_at: new Date()
    }
    
    return proveedores[index]
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = proveedores.findIndex(proveedor => proveedor.id === id)
    if (index === -1) return false
    
    proveedores.splice(index, 1)
    return true
  }

  static async activar(id: string): Promise<Proveedor | null> {
    return this.update(id, { estado: EstadoProveedor.ACTIVO })
  }

  static async suspender(id: string): Promise<Proveedor | null> {
    return this.update(id, { estado: EstadoProveedor.SUSPENDIDO })
  }
}
