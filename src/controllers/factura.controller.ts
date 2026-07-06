import { FacturaRepository } from "@/repositories/factura.repository"

// Reglas de negocio de facturas. El I/O vive en FacturaRepository (A1): acá quedan
// la generación del número, el aplanado de joins, el default de estado (S2) y el
// orquestado de líneas + relaciones N:M con certificaciones.
export class FacturaService {
  static async getAll() {
    const facturas = await FacturaRepository.findAllWithProveedor()
    return facturas.map((factura: any) => ({
      ...factura,
      proveedor_nombre: factura.gu_proveedores?.nombre,
      proveedor_cuit: factura.gu_proveedores?.cuit,
    }))
  }

  static async getById(id: number) {
    const factura = await FacturaRepository.findByIdWithProveedor(id)
    if (!factura) return null

    const lineas = await FacturaRepository.findLineasByFacturaId(id)
    const certificaciones = await FacturaRepository.findCertificacionesByFacturaId(id)

    return {
      ...factura,
      proveedor_nombre: factura.gu_proveedores?.nombre,
      proveedor_cuit: factura.gu_proveedores?.cuit,
      proveedor_email: factura.gu_proveedores?.email,
      proveedor_direccion: factura.gu_proveedores?.direccion,
      lineas,
      certificaciones: certificaciones.map((c: any) => c.gu_certificaciones),
    }
  }

  static async getCertificacionesAprobadas(proveedorId: number) {
    return FacturaRepository.findCertificacionesAprobadas(proveedorId)
  }

  static async create(data: any) {
    const { lineas, certificaciones_ids, ...facturaData } = data

    // Número automático FACT-YYYY-NNN (regla; el último número lo trae el repo)
    const numero_factura = FacturaService.siguienteNumero(await FacturaRepository.findLastNumero())

    const nuevaFactura = await FacturaRepository.insert({
      ...facturaData,
      numero_factura,
      estado: "borrador", // S2: el estado inicial lo fija el server, nunca el cliente
    })

    // Líneas de la factura
    await FacturaRepository.insertLineas(
      (lineas || []).map((linea: any) => ({ ...linea, factura_id: nuevaFactura.id }))
    )

    // Certificaciones asociadas (N:M)
    await FacturaRepository.insertCertificacionRelations(
      (certificaciones_ids || []).map((certId: number) => ({
        factura_id: nuevaFactura.id,
        certificacion_id: certId,
      }))
    )

    return nuevaFactura
  }

  // FACT-YYYY-NNN: incrementa dentro del año en curso, reinicia en 001 al cambiar de año.
  // (Antes el default con tabla vacía estaba hardcodeado a 'FACT-2025-001' — P5; ahora usa el año corriente.)
  private static siguienteNumero(ultimo: string | null): string {
    const year = new Date().getFullYear()
    if (ultimo) {
      const match = ultimo.match(/FACT-(\d{4})-(\d{3})/)
      if (match) {
        const lastYear = parseInt(match[1])
        const lastNum = parseInt(match[2])
        if (year === lastYear) {
          return `FACT-${year}-${(lastNum + 1).toString().padStart(3, "0")}`
        }
      }
    }
    return `FACT-${year}-001`
  }

  static async update(id: number, data: any) {
    const { certificaciones_ids, ...facturaData } = data

    const facturaActualizada = await FacturaRepository.update(id, facturaData)
    if (!facturaActualizada) return null

    // Reemplazar certificaciones asociadas si se proporcionaron
    if (certificaciones_ids !== undefined) {
      await FacturaRepository.deleteCertificacionRelations(id)
      await FacturaRepository.insertCertificacionRelations(
        certificaciones_ids.map((certId: number) => ({
          factura_id: id,
          certificacion_id: certId,
        }))
      )
    }

    return facturaActualizada
  }

  static async delete(id: number) {
    return FacturaRepository.deleteById(id)
  }
}
