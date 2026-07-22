// Catálogo de permisos RBAC (PERM-01). Estático y atado a las rutas → fuente de verdad en
// código, no en la DB (evita drift). Importable desde cliente y server (sin deps, sin I/O).
// La asignación rol→permisos vive en gu_roles.permisos (DB); esto solo enumera qué claves
// `modulo:accion` son legítimas y sus etiquetas para la matriz de la UI (Fase 2).

export type Accion = "ver" | "crear" | "aprobar" | "borrar"

export const ACCION_LABEL: Record<Accion, string> = {
  ver: "Ver",
  crear: "Crear / Editar",
  aprobar: "Aprobar / Anular",
  borrar: "Borrar",
}

// Módulo → etiqueta + acciones válidas. Los 4 módulos de workflow tienen las 4 acciones;
// proveedores e items solo ver/crear (no tienen aprobación ni borrado en el circuito). = 20 pares.
export const PERMISOS_CATALOGO = {
  ordenes_compra: { label: "Órdenes de compra", acciones: ["ver", "crear", "aprobar", "borrar"] },
  certificaciones: { label: "Certificaciones", acciones: ["ver", "crear", "aprobar", "borrar"] },
  facturas: { label: "Facturas", acciones: ["ver", "crear", "aprobar", "borrar"] },
  ordenes_pago: { label: "Órdenes de pago", acciones: ["ver", "crear", "aprobar", "borrar"] },
  proveedores: { label: "Proveedores", acciones: ["ver", "crear"] },
  items: { label: "Ítems", acciones: ["ver", "crear"] },
} as const satisfies Record<string, { label: string; acciones: Accion[] }>

// Las 20 claves `modulo:accion` válidas, en Set para chequeo O(1).
export const PERMISOS_VALIDOS: Set<string> = new Set(
  Object.entries(PERMISOS_CATALOGO).flatMap(([modulo, def]) =>
    def.acciones.map((accion) => `${modulo}:${accion}`)
  )
)

// ¿La clave `modulo:accion` es un permiso legítimo del catálogo? (path de escritura, Fase 2).
export function esPermisoValido(clave: string): boolean {
  return PERMISOS_VALIDOS.has(clave)
}
