import {
  CreateOrdenCompraData,
  CreateOrdenCompraLinea,
  OrdenCompra,
  OrdenCompraLinea,
  OrdenCompraLineaConItem,
  CreateLineaFromItem,
} from "@/models/orden-compra.model"
import { OrdenCompraRepository } from "@/repositories/orden-compra.repository"
import { ItemService } from "./item.controller"

// Reglas de negocio de órdenes de compra. El I/O vive en OrdenCompraRepository (A1):
// acá quedan el default de estado (S2), la compensación anti-huérfanas y el cálculo
// de totales de línea (precio × cantidad, IVA) al crear/actualizar desde el catálogo.
export class OrdenCompraService {
  static async getAll(): Promise<OrdenCompra[]> {
    return OrdenCompraRepository.findAll()
  }

  static async getById(id: number): Promise<OrdenCompra | null> {
    return OrdenCompraRepository.findById(id)
  }

  // crea la OC (cabecera + líneas opcionales)
  static async create(
    payload: CreateOrdenCompraData & { lineas?: Omit<CreateOrdenCompraLinea, "orden_compra_id">[] }
  ): Promise<OrdenCompra> {
    const { lineas, ...ocData } = payload

    const oc = await OrdenCompraRepository.insert({ ...ocData, estado: "borrador" }) // S2: estado inicial fijado por el server

    if (lineas && lineas.length > 0) {
      try {
        await OrdenCompraRepository.insertLineas(lineas.map((l) => ({ ...l, orden_compra_id: oc.id })))
      } catch (e) {
        // compensación: no dejar una OC huérfana si fallan las líneas
        await OrdenCompraRepository.deleteById(oc.id)
        throw e
      }
    }

    return oc
  }

  // crea las líneas para una OC ya creada
  static async createLines(lines: CreateOrdenCompraLinea[]): Promise<OrdenCompraLinea[]> {
    return OrdenCompraRepository.insertLineasReturning(lines)
  }

  static async getLinesByOrdenId(ordenId: number) {
    return OrdenCompraRepository.findLineasByOrdenId(ordenId)
  }

  static async update(id: string | number, payload: Partial<OrdenCompra>): Promise<OrdenCompra | null> {
    return OrdenCompraRepository.update(id, payload)
  }

  static async delete(id: string | number): Promise<boolean> {
    return OrdenCompraRepository.deleteById(id)
  }

  // Líneas con la info del item del catálogo (LEFT JOIN a gu_items)
  static async getLinesWithItems(ordenId: number): Promise<OrdenCompraLineaConItem[]> {
    return OrdenCompraRepository.findLineasWithItems(ordenId)
  }

  // Crear línea desde un item del catálogo (calcula precio/totales según el item)
  static async createLineFromItem(
    ordenId: number,
    lineaData: CreateLineaFromItem
  ): Promise<OrdenCompraLinea> {
    const item = await ItemService.getById(lineaData.item_id)
    if (!item) {
      throw new Error(`Item con ID ${lineaData.item_id} no encontrado`)
    }

    // Usar precio sugerido si no se provee uno específico
    const precioUnitario = lineaData.precio_unitario_neto ?? item.precio_sugerido ?? 0
    const ivaPorcentaje = lineaData.iva_porcentaje ?? 21
    const cantidad = lineaData.cantidad

    // Calcular totales
    const totalNeto = precioUnitario * cantidad
    const totalConIva = totalNeto * (1 + ivaPorcentaje / 100)

    // Usar nombre del item como descripción si no se provee
    const descripcion = lineaData.descripcion || item.nombre

    const nuevaLinea: CreateOrdenCompraLinea = {
      orden_compra_id: ordenId,
      item_id: item.id,
      descripcion,
      cantidad,
      precio_unitario_neto: precioUnitario,
      iva_porcentaje: ivaPorcentaje,
      total_neto: totalNeto,
      total_con_iva: totalConIva,
      estado: "borrador",
    }

    return OrdenCompraRepository.insertLinea(nuevaLinea)
  }

  // Actualizar una línea; si cambia cantidad/precio/IVA, recalcula los totales
  static async updateLine(
    lineaId: number,
    updates: Partial<CreateOrdenCompraLinea>
  ): Promise<OrdenCompraLinea | null> {
    if (
      updates.cantidad !== undefined ||
      updates.precio_unitario_neto !== undefined ||
      updates.iva_porcentaje !== undefined
    ) {
      const lineaActual = await OrdenCompraRepository.findLineaById(lineaId)
      if (lineaActual) {
        const cantidad = updates.cantidad ?? lineaActual.cantidad
        const precio = updates.precio_unitario_neto ?? lineaActual.precio_unitario_neto
        const iva = updates.iva_porcentaje ?? lineaActual.iva_porcentaje

        updates.total_neto = cantidad * precio
        updates.total_con_iva = updates.total_neto * (1 + iva / 100)
      }
    }

    return OrdenCompraRepository.updateLinea(lineaId, updates)
  }

  static async deleteLine(lineaId: number): Promise<boolean> {
    return OrdenCompraRepository.deleteLinea(lineaId)
  }
}
