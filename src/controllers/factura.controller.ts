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

  // numero_factura (FACT-N) lo genera la DB; estado lo fija el server (S2).
  static async create(data: any) {
    const { lineas, certificaciones_ids, ...facturaData } = data

    const nuevaFactura = await FacturaRepository.insert({
      ...facturaData,
      estado: "borrador",
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
