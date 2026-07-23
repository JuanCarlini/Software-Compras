import type { TablesUpdate } from "@/lib/supabase/database.types"
import { CertificacionRepository } from "@/repositories/certificacion.repository"
import { OrdenCompraRepository } from "@/repositories/orden-compra.repository"
import { HttpError } from "@/lib/route/http-error"
import { totalesDeCertificacion } from "@/shared/totales"
import { puedeTransicionar, TRANSICIONES_APROBACION } from "@/shared/transiciones"
import type { CreateCertificacionLinea, EstadoAprobacion } from "@/models"

interface CreateCertificacionInput {
  orden_compra_id: number
  fecha_devengado?: string | null
  observaciones?: string | null
  lineas: CreateCertificacionLinea[]
}

// Reglas de negocio de certificaciones. El I/O vive en CertificacionRepository (A1).
//
// Lo que NO vive acá porque es de la DB (y por eso no es bypasseable):
//   - numero_cert CE-N.s ............... fn_num_cert
//   - avance_monto / % / iva / numero_lce  fn_lce_derive (input único: avance_unidades)
//   - tope del 100% por unidades ....... fn_check_avance_100
//   - "la OC tiene que estar aprobada" . fn_cert_oc_aprobada (+ hereda el proveedor)
//   - avance disponible por línea ...... vista v_loc_rollup
//   - estado de facturación ............ vista v_cert_rollup
// Los chequeos equivalentes de abajo son PRE-validación: dan un error más claro y evitan
// un round-trip, pero la garantía está en los triggers.
export class CertificacionService {
  static async getAll() {
    const certs = await CertificacionRepository.findAllWithRelations()
    if (certs.length === 0) return []

    const rollups = await CertificacionRepository.findRollupsByIds(certs.map((c: any) => c.id))
    const porId = new Map(rollups.map((r) => [r.certificacion_id, r]))

    return certs.map((cert: any) => ({
      ...cert,
      proveedor_nombre: cert.gu_proveedores?.nombre,
      numero_oc: cert.gu_ordenesdecompra?.numero_oc,
      estado_facturacion: porId.get(cert.id)?.estado_facturacion ?? "sin",
      monto_facturado: Number(porId.get(cert.id)?.monto_facturado ?? 0),
    }))
  }

  static async getById(id: number) {
    const cert = await CertificacionRepository.findByIdWithRelations(id)
    if (!cert) return null

    const [lineas, rollups] = await Promise.all([
      CertificacionRepository.findLineasByCertId(id),
      CertificacionRepository.findRollupsByIds([id]),
    ])

    return {
      ...cert,
      proveedor_nombre: cert.gu_proveedores?.nombre,
      proveedor_cuit: cert.gu_proveedores?.cuit,
      proveedor_email: cert.gu_proveedores?.email,
      numero_oc: cert.gu_ordenesdecompra?.numero_oc,
      moneda: cert.gu_ordenesdecompra?.moneda,
      lineas,
      estado_facturacion: rollups[0]?.estado_facturacion ?? "sin",
      monto_facturado: Number(rollups[0]?.monto_facturado ?? 0),
    }
  }

  /**
   * Crea la certificación contra UNA orden de compra aprobada.
   * El proveedor lo hereda de la OC (no lo elige el cliente) y el número lo genera la DB.
   * Las líneas solo llevan `avance_unidades`: el resto lo deriva fn_lce_derive.
   */
  static async create(payload: CreateCertificacionInput) {
    const { orden_compra_id, lineas, ...certData } = payload

    if (!lineas || lineas.length === 0) {
      throw new HttpError(422, "La certificación debe tener al menos una línea")
    }

    const oc = await OrdenCompraRepository.findById(orden_compra_id)
    if (!oc) throw new HttpError(404, "Orden de compra no encontrada")
    if (oc.estado !== "aprobado") {
      throw new HttpError(
        422,
        `Solo se puede certificar contra una orden de compra aprobada (la OC ${oc.numero_oc} está en estado "${oc.estado}")`
      )
    }

    const nuevaCert = await CertificacionRepository.insert({
      ...certData,
      orden_compra_id,
      proveedor_id: oc.proveedor_id,
      estado: "borrador",
    })

    try {
      await CertificacionRepository.insertLineas(
        lineas.map((l) => ({
          certificacion_id: nuevaCert.id,
          linea_oc_id: l.linea_oc_id,
          avance_unidades: l.avance_unidades,
        }))
      )
      await CertificacionService.recalcularCabecera(nuevaCert.id)
    } catch (e) {
      // Sin transacción de cliente: si el trigger del 100% rechaza una línea, la cabecera
      // quedaría huérfana. Se compensa y se propaga el error crudo (la ruta lo hace 422).
      await CertificacionRepository.deleteById(nuevaCert.id)
      throw e
    }

    return nuevaCert
  }

  // Los totales de la cabecera los suma la app, desde las líneas ya derivadas por el trigger.
  static async recalcularCabecera(certId: number): Promise<void> {
    const lineas = await CertificacionRepository.findLineasByCertId(certId)
    await CertificacionRepository.update(certId, totalesDeCertificacion(lineas))
  }

  // Pre-chequeo del grafo (409). Los gates de negocio son triggers y devuelven 422.
  static async cambiarEstado(id: number, destino: EstadoAprobacion) {
    const cert = await CertificacionRepository.findByIdWithRelations(id)
    if (!cert) throw new HttpError(404, "Certificación no encontrada")

    if (!puedeTransicionar(TRANSICIONES_APROBACION, cert.estado, destino)) {
      throw new HttpError(409, `No se puede pasar de ${cert.estado} a ${destino}`)
    }

    return CertificacionRepository.updateEstado(id, destino)
  }

  static async update(id: number, data: TablesUpdate<"gu_certificaciones">) {
    return CertificacionRepository.update(id, data)
  }

  static async delete(id: number) {
    return CertificacionRepository.deleteById(id)
  }

  /**
   * Líneas certificables de una OC, con su saldo. El avance NO se recalcula en JS:
   * lo publica v_loc_rollup (solo certificaciones aprobadas). Alimenta el formulario
   * para que el usuario vea el disponible antes de enviar; el tope lo aplica el trigger.
   */
  static async getLineasDisponibles(ordenCompraId: number) {
    const lineas = await CertificacionRepository.findLineasDisponibles(ordenCompraId)
    if (lineas.length === 0) return []

    const rollups = await CertificacionRepository.findLocRollups(ordenCompraId)
    const porLinea = new Map(rollups.map((r) => [r.linea_oc_id, r]))

    return lineas.map((l: any) => {
      const rollup = porLinea.get(l.id)
      return {
        id: l.id,
        numero_loc: l.numero_loc,
        descripcion: l.descripcion,
        unidad_medida: l.unidad_medida,
        cantidad: Number(l.cantidad),
        precio_unitario_neto: Number(l.precio_unitario_neto),
        iva_porcentaje: Number(l.iva_porcentaje),
        cantidad_certificada: Number(rollup?.unidades_certificadas ?? 0),
        cantidad_disponible: Number(rollup?.unidades_pendientes ?? l.cantidad),
        estado_certificacion: rollup?.estado_certificacion ?? "sin",
      }
    })
  }
}
