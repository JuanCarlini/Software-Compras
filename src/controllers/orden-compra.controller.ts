import {
  CreateOrdenCompraData,
  CreateOrdenCompraLinea,
  OrdenCompra,
  OrdenCompraLinea,
  OrdenCompraLineaConItem,
  CreateLineaFromItem,
} from "@/models/orden-compra.model"
import type { TablesUpdate } from "@/lib/supabase/database.types"
import { OrdenCompraRepository } from "@/repositories/orden-compra.repository"
import { HttpError } from "@/shared/http-error"
import { totalesDeLinea, totalesDeCabecera } from "@/shared/totales"
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

  // crea la OC (cabecera + líneas opcionales).
  // numero_oc lo genera la DB (fn_num_oc); estado lo fija el server (S2); los totales
  // de línea y cabecera los calcula la app (la DB no los mantiene).
  static async create(
    payload: CreateOrdenCompraData & { lineas?: CreateLineaFromItem[] }
  ): Promise<OrdenCompra> {
    const { lineas, ...ocData } = payload

    const oc = await OrdenCompraRepository.insert({ ...ocData, estado: "borrador" })

    if (lineas && lineas.length > 0) {
      try {
        await OrdenCompraRepository.insertLineas(
          lineas.map((l) => OrdenCompraService.armarLinea(oc.id, l))
        )
        await OrdenCompraService.recalcularCabecera(oc.id)
      } catch (e) {
        // compensación: no dejar una OC huérfana si fallan las líneas
        await OrdenCompraRepository.deleteById(oc.id)
        throw e
      }
    }

    return oc
  }

  // TODO(F3): si no viene precio, heredarlo de gu_item_proveedor_precio (async).
  private static armarLinea(ocId: number, l: CreateLineaFromItem): CreateOrdenCompraLinea {
    if (l.precio_unitario_neto === undefined) {
      throw new HttpError(422, "Falta el precio unitario de la línea")
    }
    const iva = l.iva_porcentaje ?? 21
    return {
      orden_compra_id: ocId,
      item_id: l.item_id,
      descripcion: l.descripcion ?? "",
      cantidad: l.cantidad,
      precio_unitario_neto: l.precio_unitario_neto,
      iva_porcentaje: iva,
      ...totalesDeLinea(l.cantidad, l.precio_unitario_neto, iva),
    }
  }

  // La DB no mantiene los totales de cabecera: tras tocar líneas, la app los reescribe.
  static async recalcularCabecera(ocId: number): Promise<void> {
    const lineas = await OrdenCompraRepository.findLineasByOrdenId(ocId)
    await OrdenCompraRepository.update(ocId, totalesDeCabecera(lineas))
  }

  // crea las líneas para una OC ya creada
  static async createLines(lines: CreateOrdenCompraLinea[]): Promise<OrdenCompraLinea[]> {
    return OrdenCompraRepository.insertLineasReturning(lines)
  }

  static async getLinesByOrdenId(ordenId: number) {
    return OrdenCompraRepository.findLineasByOrdenId(ordenId)
  }

  static async update(id: number, payload: TablesUpdate<"gu_ordenesdecompra">): Promise<OrdenCompra | null> {
    return OrdenCompraRepository.update(id, payload)
  }

  static async delete(id: number): Promise<boolean> {
    return OrdenCompraRepository.deleteById(id)
  }

  // Líneas con la info del item del catálogo (LEFT JOIN a gu_items)
  static async getLinesWithItems(ordenId: number): Promise<OrdenCompraLineaConItem[]> {
    return OrdenCompraRepository.findLineasWithItems(ordenId)
  }

  // Crear línea desde un item del catálogo (calcula los totales; la DB no los mantiene).
  // TODO(F3): el precio se hereda de gu_item_proveedor_precio si la UI no lo manda.
  static async createLineFromItem(
    ordenId: number,
    lineaData: CreateLineaFromItem
  ): Promise<OrdenCompraLinea> {
    const item = await ItemService.getById(lineaData.item_id)
    if (!item) {
      throw new HttpError(404, `Item con ID ${lineaData.item_id} no encontrado`)
    }

    // El item ya no tiene precio_sugerido: el precio vive en gu_item_proveedor_precio (N:M).
    if (lineaData.precio_unitario_neto === undefined) {
      throw new HttpError(422, "Falta el precio unitario de la línea")
    }

    const ivaPorcentaje = lineaData.iva_porcentaje ?? 21
    const { total_neto, total_con_iva } = totalesDeLinea(
      lineaData.cantidad,
      lineaData.precio_unitario_neto,
      ivaPorcentaje
    )

    return OrdenCompraRepository.insertLinea({
      orden_compra_id: ordenId,
      item_id: item.id,
      descripcion: lineaData.descripcion || item.nombre,
      cantidad: lineaData.cantidad,
      precio_unitario_neto: lineaData.precio_unitario_neto,
      iva_porcentaje: ivaPorcentaje,
      total_neto,
      total_con_iva,
    })
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
        const totales = totalesDeLinea(
          updates.cantidad ?? lineaActual.cantidad,
          updates.precio_unitario_neto ?? lineaActual.precio_unitario_neto,
          updates.iva_porcentaje ?? lineaActual.iva_porcentaje
        )
        updates.total_neto = totales.total_neto
        updates.total_con_iva = totales.total_con_iva
      }
    }

    return OrdenCompraRepository.updateLinea(lineaId, updates)
  }

  static async deleteLine(lineaId: number): Promise<boolean> {
    return OrdenCompraRepository.deleteLinea(lineaId)
  }
}
