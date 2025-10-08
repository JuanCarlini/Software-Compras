import { 
  OrdenCompra, 
  CreateOrdenCompraData, 
  UpdateOrdenCompraData,
  EstadoOrdenCompra 
} from "@/models"
import { NotFoundError, ValidationError } from "@/shared/errors"

// TODO: Conectar con base de datos real
// const prisma = new PrismaClient()

// Almacenamiento temporal en memoria (se perderá al reiniciar)
// TODO: Reemplazar con conexión a base de datos real
let ordenesTemporales: OrdenCompra[] = []
let nextId = 1

export class OrdenCompraService {
  static async getAll(): Promise<OrdenCompra[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // TODO: Reemplazar con query real
    // return await prisma.ordenCompra.findMany({
    //   include: { proveedor: true, items: true }
    // })
    
    return ordenesTemporales
  }

  static async getById(id: string): Promise<OrdenCompra | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // TODO: Reemplazar con query real
    // return await prisma.ordenCompra.findUnique({
    //   where: { id },
    //   include: { proveedor: true, items: true }
    // })
    
    return ordenesTemporales.find(o => o.id === id) || null
  }

  static async create(data: CreateOrdenCompraData): Promise<OrdenCompra> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Validaciones de negocio
    if (!data.proveedor_id) {
      throw new ValidationError("Proveedor es requerido", "proveedor_id")
    }

    if (!data.items || data.items.length === 0) {
      throw new ValidationError("La orden debe tener al menos un item", "items")
    }

    if (data.fecha_entrega <= new Date()) {
      throw new ValidationError("La fecha de entrega debe ser futura", "fecha_entrega")
    }

    // Calcular totales
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0)
    const impuestos = subtotal * 0.21 // IVA 21%
    const total = subtotal + impuestos
    
    const nuevaOrden: OrdenCompra = {
      id: String(nextId++),
      numero: `OC-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`,
      proveedor_id: data.proveedor_id,
      proveedor_nombre: `Proveedor ${data.proveedor_id}`, // TODO: obtener nombre real
      fecha_creacion: new Date(),
      fecha_entrega: data.fecha_entrega,
      descripcion: data.descripcion,
      subtotal,
      impuestos,
      total,
      estado: EstadoOrdenCompra.PENDIENTE,
      items: data.items.map((item, index) => ({
        ...item,
        id: `${nextId}-${index + 1}`,
        orden_compra_id: String(nextId)
      })),
      created_at: new Date(),
      updated_at: new Date()
    }
    
    ordenesTemporales.push(nuevaOrden)
    return nuevaOrden
  }

  static async update(id: string, data: UpdateOrdenCompraData): Promise<OrdenCompra | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Validaciones
    if (data.fecha_entrega && data.fecha_entrega <= new Date()) {
      throw new ValidationError("La fecha de entrega debe ser futura", "fecha_entrega")
    }
    
    const index = ordenesTemporales.findIndex(o => o.id === id)
    if (index === -1) {
      throw new NotFoundError("Orden no encontrada")
    }
    
    ordenesTemporales[index] = {
      ...ordenesTemporales[index],
      ...data,
      updated_at: new Date()
    }
    
    return ordenesTemporales[index]
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = ordenesTemporales.findIndex(o => o.id === id)
    if (index === -1) {
      return false
    }
    
    ordenesTemporales.splice(index, 1)
    return true
  }

  static async aprobar(id: string): Promise<OrdenCompra | null> {
    return this.update(id, { estado: EstadoOrdenCompra.APROBADA })
  }

  static async rechazar(id: string): Promise<OrdenCompra | null> {
    return this.update(id, { estado: EstadoOrdenCompra.RECHAZADA })
  }

  static async enviar(id: string): Promise<OrdenCompra | null> {
    return this.update(id, { estado: EstadoOrdenCompra.ENVIADA })
  }

  static async marcarRecibida(id: string): Promise<OrdenCompra | null> {
    return this.update(id, { estado: EstadoOrdenCompra.RECIBIDA })
  }

  static async cancelar(id: string): Promise<OrdenCompra | null> {
    return this.update(id, { estado: EstadoOrdenCompra.CANCELADA })
  }

  // Métodos de consulta adicionales
  static async getByProveedor(proveedorId: string): Promise<OrdenCompra[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return ordenesTemporales.filter(o => o.proveedor_id === proveedorId)
  }

  static async getByEstado(estado: EstadoOrdenCompra): Promise<OrdenCompra[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return ordenesTemporales.filter(o => o.estado === estado)
  }

  static async getEstadisticas(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const stats = ordenesTemporales.reduce((acc, orden) => {
      acc[orden.estado] = (acc[orden.estado] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalMonto = ordenesTemporales.reduce((sum, o) => sum + o.total, 0)
    
    return {
      total_ordenes: ordenesTemporales.length,
      monto_total: totalMonto,
      por_estado: stats
    }
  }
}
