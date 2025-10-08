import { 
  OrdenPago, 
  CreateOrdenPagoData, 
  UpdateOrdenPagoData,
  EstadoOrdenPago,
  MetodoPago 
} from "@/models"
import { NotFoundError, ValidationError, BusinessLogicError } from "@/shared/errors"

// TODO: Conectar con base de datos real
// const prisma = new PrismaClient()

// Almacenamiento temporal en memoria (se perderá al reiniciar)
// TODO: Reemplazar con conexión a base de datos real
let ordenesPagoTemporales: OrdenPago[] = []
let nextId = 1

export class OrdenPagoController {
  static async getAll(): Promise<OrdenPago[]> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // TODO: Reemplazar con query real
    // return await prisma.ordenPago.findMany({
    //   include: { ordenCompra: true, proveedor: true },
    //   orderBy: { created_at: 'desc' }
    // })
    
    return ordenesPagoTemporales
  }

  static async getById(id: string): Promise<OrdenPago | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // TODO: Reemplazar con query real
    // return await prisma.ordenPago.findUnique({
    //   where: { id },
    //   include: { ordenCompra: true, proveedor: true }
    // })
    
    return ordenesPagoTemporales.find(op => op.id === id) || null
  }

  static async create(data: CreateOrdenPagoData): Promise<OrdenPago> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Validaciones de negocio
    if (!data.orden_compra_id) {
      throw new ValidationError("Orden de compra es requerida", "orden_compra_id")
    }

    if (!data.proveedor_id) {
      throw new ValidationError("Proveedor es requerido", "proveedor_id")
    }

    if (data.monto <= 0) {
      throw new ValidationError("El monto debe ser mayor a 0", "monto")
    }

    if (data.fecha_vencimiento <= new Date()) {
      throw new ValidationError("La fecha de vencimiento debe ser futura", "fecha_vencimiento")
    }

    // TODO: Verificar que la orden de compra existe y está aprobada
    // (Por ahora omitimos esta validación)
    
    const nuevaOrdenPago: OrdenPago = {
      id: String(nextId++),
      numero: await this.generateNumero(),
      orden_compra_id: data.orden_compra_id,
      proveedor_id: data.proveedor_id,
      proveedor_nombre: `Proveedor ${data.proveedor_id}`, // TODO: obtener nombre real
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
    
    ordenesPagoTemporales.push(nuevaOrdenPago)
    return nuevaOrdenPago
  }

  static async update(id: string, data: UpdateOrdenPagoData): Promise<OrdenPago | null> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Validaciones
    if (data.monto && data.monto <= 0) {
      throw new ValidationError("El monto debe ser mayor a 0", "monto")
    }

    if (data.fecha_vencimiento && data.fecha_vencimiento <= new Date()) {
      throw new ValidationError("La fecha de vencimiento debe ser futura", "fecha_vencimiento")
    }
    
    const index = ordenesPagoTemporales.findIndex(op => op.id === id)
    if (index === -1) {
      throw new NotFoundError("Orden de pago no encontrada")
    }
    
    ordenesPagoTemporales[index] = {
      ...ordenesPagoTemporales[index],
      ...data,
      updated_at: new Date()
    }
    
    return ordenesPagoTemporales[index]
  }

  static async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Verificar que se puede eliminar (solo si está pendiente)
    const orden = ordenesPagoTemporales.find(op => op.id === id)
    if (orden && orden.estado !== EstadoOrdenPago.PENDIENTE) {
      throw new BusinessLogicError("Solo se pueden eliminar órdenes pendientes")
    }
    
    const index = ordenesPagoTemporales.findIndex(op => op.id === id)
    if (index === -1) {
      return false
    }
    
    ordenesPagoTemporales.splice(index, 1)
    return true
  }

  static async aprobar(id: string): Promise<OrdenPago | null> {
    return this.update(id, { estado: EstadoOrdenPago.APROBADA })
  }

  static async rechazar(id: string): Promise<OrdenPago | null> {
    return this.update(id, { estado: EstadoOrdenPago.RECHAZADA })
  }

  static async marcarPagada(id: string, referenciaBancaria: string): Promise<OrdenPago | null> {
    if (!referenciaBancaria || referenciaBancaria.trim().length === 0) {
      throw new ValidationError("La referencia bancaria es requerida", "referencia_bancaria")
    }

    return this.update(id, { 
      estado: EstadoOrdenPago.PAGADA,
      referencia_bancaria: referenciaBancaria
    })
  }

  static async marcarVencida(id: string): Promise<OrdenPago | null> {
    return this.update(id, { estado: EstadoOrdenPago.VENCIDA })
  }

  // Métodos de consulta adicionales
  static async getByProveedor(proveedorId: string): Promise<OrdenPago[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return ordenesPagoTemporales.filter(op => op.proveedor_id === proveedorId)
  }

  static async getByEstado(estado: EstadoOrdenPago): Promise<OrdenPago[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return ordenesPagoTemporales.filter(op => op.estado === estado)
  }

  static async getVencidas(): Promise<OrdenPago[]> {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const ahora = new Date()
    return ordenesPagoTemporales.filter(op => 
      op.fecha_vencimiento < ahora && 
      [EstadoOrdenPago.PENDIENTE, EstadoOrdenPago.APROBADA].includes(op.estado)
    )
  }

  static async getEstadisticas(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    const stats = ordenesPagoTemporales.reduce((acc, orden) => {
      acc[orden.estado] = (acc[orden.estado] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalMonto = ordenesPagoTemporales.reduce((sum, op) => sum + op.monto, 0)
    
    return {
      total_ordenes: ordenesPagoTemporales.length,
      monto_total: totalMonto,
      por_estado: stats
    }
  }

  // Método privado para generar número de orden
  private static async generateNumero(): Promise<string> {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const sequence = nextId
    
    return `OP-${year}${month}-${String(sequence).padStart(4, '0')}`
  }
}
