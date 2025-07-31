import { 
  OrdenPago, 
  CreateOrdenPagoData, 
  UpdateOrdenPagoData,
  EstadoOrdenPago,
  MetodoPago
} from "@/models"

// Datos mock de órdenes de pago
const ordenesPago: OrdenPago[] = [
  {
    id: "001",
    numero: "OP-2025-001",
    orden_compra_id: "001",
    proveedor_id: "1",
    proveedor_nombre: "ABC Corporation",
    fecha_creacion: new Date("2025-01-16"),
    fecha_vencimiento: new Date("2025-01-31"),
    monto: 5250,
    moneda: "ARS",
    estado: EstadoOrdenPago.PENDIENTE,
    metodo_pago: MetodoPago.TRANSFERENCIA,
    observaciones: "Pago de orden de compra OC-2025-001",
    created_at: new Date("2025-01-16"),
    updated_at: new Date("2025-01-16")
  },
  {
    id: "002",
    numero: "OP-2025-002", 
    orden_compra_id: "002",
    proveedor_id: "2",
    proveedor_nombre: "XYZ Supplies Ltd",
    fecha_creacion: new Date("2025-01-15"),
    fecha_vencimiento: new Date("2025-01-30"),
    monto: 8750,
    moneda: "ARS",
    estado: EstadoOrdenPago.APROBADA,
    metodo_pago: MetodoPago.TRANSFERENCIA,
    referencia_bancaria: "TRF-20250115-001",
    observaciones: "Pago urgente - proveedor preferencial",
    created_at: new Date("2025-01-15"),
    updated_at: new Date("2025-01-15")
  },
  {
    id: "003",
    numero: "OP-2025-003",
    orden_compra_id: "003", 
    proveedor_id: "3",
    proveedor_nombre: "Tech Solutions Inc",
    fecha_creacion: new Date("2025-01-14"),
    fecha_vencimiento: new Date("2025-01-28"),
    monto: 12400,
    moneda: "ARS",
    estado: EstadoOrdenPago.PAGADA,
    metodo_pago: MetodoPago.CHEQUE,
    referencia_bancaria: "CHQ-20250114-001",
    created_at: new Date("2025-01-14"),
    updated_at: new Date("2025-01-14")
  }
]

export class OrdenPagoService {
  static async getAll(): Promise<OrdenPago[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return ordenesPago
  }

  static async getById(id: string): Promise<OrdenPago | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return ordenesPago.find(orden => orden.id === id) || null
  }

  static async create(data: CreateOrdenPagoData): Promise<OrdenPago> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newId = (ordenesPago.length + 1).toString().padStart(3, '0')
    const newOrden: OrdenPago = {
      id: newId,
      numero: `OP-2025-${newId}`,
      orden_compra_id: data.orden_compra_id,
      proveedor_id: data.proveedor_id,
      proveedor_nombre: "Proveedor Ejemplo", // TODO: Obtener del servicio de proveedores
      fecha_creacion: new Date(),
      fecha_vencimiento: data.fecha_vencimiento,
      monto: data.monto,
      moneda: data.moneda,
      estado: EstadoOrdenPago.PENDIENTE,
      metodo_pago: data.metodo_pago,
      observaciones: data.observaciones,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    ordenesPago.push(newOrden)
    return newOrden
  }

  static async update(id: string, data: UpdateOrdenPagoData): Promise<OrdenPago | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const index = ordenesPago.findIndex(orden => orden.id === id)
    if (index === -1) return null
    
    ordenesPago[index] = {
      ...ordenesPago[index],
      ...data,
      updated_at: new Date()
    }
    
    return ordenesPago[index]
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const index = ordenesPago.findIndex(orden => orden.id === id)
    if (index === -1) return false
    
    ordenesPago.splice(index, 1)
    return true
  }

  static async aprobar(id: string): Promise<OrdenPago | null> {
    return this.update(id, { estado: EstadoOrdenPago.APROBADA })
  }

  static async pagar(id: string, referencia_bancaria: string): Promise<OrdenPago | null> {
    return this.update(id, { 
      estado: EstadoOrdenPago.PAGADA, 
      referencia_bancaria 
    })
  }

  static async rechazar(id: string): Promise<OrdenPago | null> {
    return this.update(id, { estado: EstadoOrdenPago.RECHAZADA })
  }

  static async getByOrdenCompra(ordenCompraId: string): Promise<OrdenPago[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return ordenesPago.filter(orden => orden.orden_compra_id === ordenCompraId)
  }

  static async getVencidas(): Promise<OrdenPago[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    const hoy = new Date()
    return ordenesPago.filter(orden => 
      orden.fecha_vencimiento < hoy && 
      orden.estado !== EstadoOrdenPago.PAGADA
    )
  }
}
