import type { EstadoAprobacion, EstadoFactura, EstadoOp } from "@/models/enums"
import type { UserRole } from "@/models/user.model"
import { ROLES_APROBACION, ROLES_ESCRITURA } from "@/shared/permissions"

// Qué transiciones existen. Es el grafo, NO el gate: las reglas de negocio
// (≥1 línea, ≤100%, Σcajas=total) son triggers en Postgres y devuelven 422.
// Acá solo se rechaza lo estructuralmente imposible (409): saltear etapas, revivir un anulado.
type Grafo<E extends string> = Record<E, readonly E[]>

// OC y CE comparten estado_aprobacion y el mismo grafo.
export const TRANSICIONES_APROBACION: Grafo<EstadoAprobacion> = {
  borrador: ["en_aprobacion", "anulado"],
  en_aprobacion: ["aprobado", "rechazado", "anulado"],
  aprobado: ["anulado"],
  rechazado: ["borrador", "anulado"],
  anulado: [],
}

// FACT no tiene aprobación intermedia.
export const TRANSICIONES_FACTURA: Grafo<EstadoFactura> = {
  borrador: ["finalizado", "anulado"],
  finalizado: ["anulado"],
  anulado: [],
}

// 'pagado' existe SOLO acá, y es terminal.
export const TRANSICIONES_OP: Grafo<EstadoOp> = {
  borrador: ["en_aprobacion", "anulado"],
  en_aprobacion: ["aprobado", "rechazado", "anulado"],
  aprobado: ["pagado", "anulado"],
  pagado: [],
  rechazado: ["borrador", "anulado"],
  anulado: [],
}

export function puedeTransicionar<E extends string>(grafo: Grafo<E>, desde: E, hacia: E): boolean {
  return (grafo[desde] ?? []).includes(hacia)
}

const REQUIERE_APROBACION = new Set(["aprobado", "rechazado", "anulado", "pagado"])

// El rol depende del DESTINO, no del documento: mandar a aprobar es escritura;
// aprobar/rechazar/anular/pagar es supervisor o admin.
export function rolRequerido(destino: string): UserRole[] {
  return REQUIERE_APROBACION.has(destino) ? ROLES_APROBACION : ROLES_ESCRITURA
}

// Igual criterio que rolRequerido, pero en el vocabulario de permisos RBAC (modulo:accion):
// aprobar/rechazar/anular/pagar → 'aprobar'; mandar-a-aprobar/volver-a-borrador → 'crear'.
// Reusa el mismo REQUIERE_APROBACION para no duplicar el criterio.
export function accionRequerida(destino: string): "aprobar" | "crear" {
  return REQUIERE_APROBACION.has(destino) ? "aprobar" : "crear"
}
