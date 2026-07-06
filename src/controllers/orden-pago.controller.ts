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

  // crear (cabecera + líneas)
  static async create(payload: any) {
    const { lineas, ...ordenData } = payload

    // Número automático OP-YYYY-NNN (regla de negocio; el último número lo trae el repo)
    const ultimoNumero = await OrdenPagoRepository.findLastNumero()
    const numero_op = OrdenPagoService.siguienteNumero(ultimoNumero)

    const nuevaOP = await OrdenPagoRepository.insert({
      ...ordenData,
      numero_op,
      estado: "pendiente", // S2: estado inicial fijado por el server, nunca por el cliente
    })

    if (lineas && lineas.length > 0) {
      await OrdenPagoRepository.insertLineas(
        lineas.map((linea: any) => ({ ...linea, orden_pago_id: nuevaOP.id }))
      )
    }

    return nuevaOP
  }

  // OP-YYYY-NNN: incrementa dentro del año en curso, reinicia en 001 al cambiar de año.
  // Función pura (sin I/O) → testeable sin DB.
  private static siguienteNumero(ultimo: string | null): string {
    const year = new Date().getFullYear()
    if (ultimo) {
      const match = ultimo.match(/OP-(\d{4})-(\d{3})/)
      if (match) {
        const lastYear = parseInt(match[1])
        const lastNum = parseInt(match[2])
        if (year === lastYear) {
          return `OP-${year}-${(lastNum + 1).toString().padStart(3, "0")}`
        }
      }
    }
    return `OP-${year}-001`
  }

  static async update(id: number, payload: any) {
    return OrdenPagoRepository.update(id, payload)
  }

  static async delete(id: number) {
    return OrdenPagoRepository.delete(id)
  }
}
