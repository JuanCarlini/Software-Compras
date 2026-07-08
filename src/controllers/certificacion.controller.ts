import { CertificacionRepository } from "@/repositories/certificacion.repository"

// Reglas de negocio de certificaciones. El I/O vive en CertificacionRepository (A1):
// acá quedan la generación del número, el aplanado de joins, la compensación
// anti-huérfanas y el cálculo del saldo certificable.
export class CertificacionService {
  static async getAll() {
    const certs = await CertificacionRepository.findAllWithRelations()
    return certs.map((cert: any) => ({
      ...cert,
      proyecto_nombre: cert.gu_proyectos?.nombre,
      proyecto_codigo: cert.gu_proyectos?.codigo,
      proveedor_nombre: cert.gu_proveedores?.nombre,
    }))
  }

  static async getById(id: number) {
    const cert = await CertificacionRepository.findByIdWithRelations(id)
    if (!cert) return null

    const lineas = await CertificacionRepository.findLineasByCertId(id)
    return {
      ...cert,
      proyecto_nombre: cert.gu_proyectos?.nombre,
      proyecto_codigo: cert.gu_proyectos?.codigo,
      proveedor_nombre: cert.gu_proveedores?.nombre,
      proveedor_cuit: cert.gu_proveedores?.cuit,
      proveedor_email: cert.gu_proveedores?.email,
      lineas,
    }
  }

  // numero_cert (CE-N.s) lo genera la DB; estado lo fija el server (S2).
  // Las líneas solo llevan avance_unidades: el resto lo deriva el trigger fn_lce_derive.
  static async create(data: any) {
    const { lineas, ...certData } = data

    const nuevaCert = await CertificacionRepository.insert({
      ...certData,
      estado: "borrador",
    })

    if (lineas && lineas.length > 0) {
      try {
        await CertificacionRepository.insertLineas(
          lineas.map((linea: any) => ({
            certificacion_id: nuevaCert.id,
            linea_oc_id: linea.linea_oc_id,
            avance_unidades: linea.avance_unidades,
          }))
        )
      } catch (e) {
        // compensación: sin transacciones en el cliente, borramos la cabecera para
        // no dejar una certificación huérfana si el trigger rechazó las líneas
        await CertificacionRepository.deleteById(nuevaCert.id)
        throw e
      }
    }

    return nuevaCert
  }

  static async update(id: number, data: any) {
    return CertificacionRepository.update(id, data)
  }

  static async delete(id: number) {
    return CertificacionRepository.deleteById(id)
  }

  /**
   * Líneas de OCs aprobadas del proveedor con su saldo certificable.
   * La regla del 100% la garantiza el trigger fn_check_avance_100 en la DB; esto solo
   * alimenta el formulario para que el usuario vea el disponible antes de enviar.
   * El avance NO se recalcula en JS: lo publica la vista v_loc_rollup (solo CE aprobadas).
   */
  static async getLineasOCDisponibles(proveedorId: number) {
    const lineasOC = await CertificacionRepository.findLineasOCAprobadas(proveedorId)
    if (lineasOC.length === 0) return []

    const rollups = await CertificacionRepository.findLocRollupsByIds(lineasOC.map((l: any) => l.id))
    const rollupPorLinea = new Map(rollups.map((r) => [r.linea_oc_id, r]))

    return lineasOC.map((l: any) => {
      const rollup = rollupPorLinea.get(l.id)
      return {
        id: l.id,
        numero_loc: l.numero_loc,
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        precio_unitario_neto: Number(l.precio_unitario_neto),
        iva_porcentaje: Number(l.iva_porcentaje),
        numero_oc: l.gu_ordenesdecompra?.numero_oc,
        orden_compra_id: l.gu_ordenesdecompra?.id,
        cantidad_certificada: Number(rollup?.unidades_certificadas ?? 0),
        cantidad_disponible: Number(rollup?.unidades_pendientes ?? l.cantidad),
        estado_certificacion: rollup?.estado_certificacion ?? "sin",
      }
    })
  }
}
