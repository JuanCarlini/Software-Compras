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

  static async create(data: any) {
    const { lineas, ...certData } = data

    // Número automático CERT-YYYY-NNN (regla; el último número lo trae el repo)
    const numero_cert = CertificacionService.siguienteNumero(await CertificacionRepository.findLastNumero())

    const nuevaCert = await CertificacionRepository.insert({
      ...certData,
      numero_cert,
      estado: "borrador", // S2: estado inicial fijado por el server, nunca por el cliente
    })

    if (lineas && lineas.length > 0) {
      try {
        await CertificacionRepository.insertLineas(
          lineas.map((linea: any) => ({ ...linea, certificacion_id: nuevaCert.id }))
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

  // CERT-YYYY-NNN: incrementa dentro del año en curso, reinicia en 001 al cambiar de año.
  private static siguienteNumero(ultimo: string | null): string {
    const year = new Date().getFullYear()
    if (ultimo) {
      const match = ultimo.match(/CERT-(\d{4})-(\d{3})/)
      if (match) {
        const lastYear = parseInt(match[1])
        const lastNum = parseInt(match[2])
        if (year === lastYear) {
          return `CERT-${year}-${(lastNum + 1).toString().padStart(3, "0")}`
        }
      }
    }
    return `CERT-${year}-001`
  }

  static async update(id: number, data: any) {
    return CertificacionRepository.update(id, data)
  }

  static async delete(id: number) {
    return CertificacionRepository.deleteById(id)
  }

  /**
   * Líneas de OCs aprobadas del proveedor con su saldo certificable.
   * La regla del 100% la garantiza el trigger check_certificacion_max_100 en la DB;
   * esto alimenta el formulario para que el usuario vea el disponible antes de enviar.
   */
  static async getLineasOCDisponibles(proveedorId: number) {
    const lineasOC = await CertificacionRepository.findLineasOCAprobadas(proveedorId)
    if (lineasOC.length === 0) return []

    const ids = lineasOC.map((l: any) => l.id)
    const certificado = await CertificacionRepository.findCertificadoByLineaOCIds(ids)

    const certificadoPorLinea = new Map<number, number>()
    for (const c of certificado) {
      certificadoPorLinea.set(
        c.linea_oc_id,
        (certificadoPorLinea.get(c.linea_oc_id) || 0) + Number(c.cantidad)
      )
    }

    return lineasOC.map((l: any) => {
      const cantidadCertificada = certificadoPorLinea.get(l.id) || 0
      return {
        id: l.id,
        descripcion: l.descripcion,
        cantidad: Number(l.cantidad),
        precio_unitario_neto: Number(l.precio_unitario_neto),
        iva_porcentaje: Number(l.iva_porcentaje),
        numero_oc: l.gu_ordenesdecompra?.numero_oc,
        orden_compra_id: l.gu_ordenesdecompra?.id,
        cantidad_certificada: cantidadCertificada,
        cantidad_disponible: Number(l.cantidad) - cantidadCertificada,
      }
    })
  }

  static async getByProyecto(proyectoId: number) {
    const certs = await CertificacionRepository.findByProyecto(proyectoId)
    return certs.map((cert: any) => ({
      ...cert,
      proveedor_nombre: cert.gu_proveedores?.nombre,
    }))
  }
}
