import { 
  OrdenCompra, 
  CreateOrdenCompraData, 
  UpdateOrdenCompraData,
  EstadoOrdenCompra 
} from "@/models"

// Por ahora usamos datos mock, luego se conectará a la BD
const ordenesCompra: OrdenCompra[] = [
  {
    id: "001",
    numero: "OC-2025-001",
    proveedor_id: "1",
    proveedor_nombre: "ABC Corporation",
    fecha_creacion: new Date("2025-01-15"),
    fecha_entrega: new Date("2025-01-25"),
    descripcion: "Compra de materiales de oficina",
    subtotal: 5000,
    impuestos: 250,
    total: 5250,
    estado: EstadoOrdenCompra.PENDIENTE,
    items: [],
    created_at: new Date("2025-01-15"),
    updated_at: new Date("2025-01-15")
  },
  {
    id: "002",
    numero: "OC-2025-002", 
    proveedor_id: "2",
    proveedor_nombre: "XYZ Supplies Ltd",
    fecha_creacion: new Date("2025-01-14"),
    fecha_entrega: new Date("2025-01-24"),
    descripcion: "Equipos de cómputo",
    subtotal: 8500,
    impuestos: 250,
    total: 8750,
    estado: EstadoOrdenCompra.APROBADA,
    items: [],
    created_at: new Date("2025-01-14"),
    updated_at: new Date("2025-01-14")
  }
]

export class OrdenCompraService {
  static async getAll(): Promise<OrdenCompra[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500))
    return ordenesCompra
  }

  static async getById(id: string): Promise<OrdenCompra | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return ordenesCompra.find(orden => orden.id === id) || null
  }

  static async create(data: CreateOrdenCompraData): Promise<OrdenCompra> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newId = (ordenesCompra.length + 1).toString().padStart(3, '0')
    const newOrden: OrdenCompra = {
      id: newId,
      numero: `OC-2025-${newId}`,
      proveedor_id: data.proveedor_id,
      proveedor_nombre: "Proveedor Ejemplo", // TODO: Obtener del servicio de proveedores
      fecha_creacion: new Date(),
      fecha_entrega: data.fecha_entrega,
      descripcion: data.descripcion,
      subtotal: data.items.reduce((sum, item) => sum + item.subtotal, 0),
      impuestos: 0, // TODO: Calcular impuestos
      total: 0, // TODO: Calcular total
      estado: EstadoOrdenCompra.PENDIENTE,
      items: data.items.map((item, index) => ({
        ...item,
        id: `${newId}-${index + 1}`,
        orden_compra_id: newId
      })),
      created_at: new Date(),
      updated_at: new Date()
    }
    
    newOrden.total = newOrden.subtotal + newOrden.impuestos
    ordenesCompra.push(newOrden)
    return newOrden
  }

  static async update(id: string, data: UpdateOrdenCompraData): Promise<OrdenCompra | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const index = ordenesCompra.findIndex(orden => orden.id === id)
    if (index === -1) return null
    
    ordenesCompra[index] = {
      ...ordenesCompra[index],
      ...data,
      updated_at: new Date()
    }
    
    return ordenesCompra[index]
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = ordenesCompra.findIndex(orden => orden.id === id)
    if (index === -1) return false
    
    ordenesCompra.splice(index, 1)
    return true
  }

  static async aprobar(id: string): Promise<OrdenCompra | null> {
    return this.update(id, { estado: EstadoOrdenCompra.APROBADA })
  }

  static async rechazar(id: string): Promise<OrdenCompra | null> {
    return this.update(id, { estado: EstadoOrdenCompra.RECHAZADA })
  }
}
