import { OrdenPagoRepository } from "@/repositories/orden-pago.repository"

// Reglas de negocio de órdenes de pago. El I/O vive en OrdenPagoRepository (A1);
// acá quedan la generación del número, el default de estado y el armado de líneas.
export class OrdenPagoService {
  // trae todas las OP (con el nombre del proveedor aplanado)
  static async getAll() {
    const ordenes = await OrdenPagoRepository.findAllWithProveedor()
    return ordenes.map((op: any) => ({
      ...op,
      proveedor_nombre: op.gu_proveedores?.nombre,
    }))
  }

  // trae una sola por id
  static async getById(id: number) {
    return OrdenPagoRepository.findById(id)
  }

  // crear (cabecera + líneas de factura).
  // numero_op (OP-N) lo genera la DB; estado nace en 'borrador' (S2 — antes decía
  // 'pendiente', que ya no existe en el enum estado_op y reventaba el INSERT).
  static async create(payload: any) {
    const { lineas, ...ordenData } = payload

    const nuevaOP = await OrdenPagoRepository.insert({
      ...ordenData,
      estado: "borrador",
    })

    if (lineas && lineas.length > 0) {
      await OrdenPagoRepository.insertLineas(
        lineas.map((linea: any) => ({ ...linea, orden_pago_id: nuevaOP.id }))
      )
    }

    return nuevaOP
  }

  static async update(id: number, payload: any) {
    return OrdenPagoRepository.update(id, payload)
  }

  static async delete(id: number) {
    return OrdenPagoRepository.delete(id)
  }
}
