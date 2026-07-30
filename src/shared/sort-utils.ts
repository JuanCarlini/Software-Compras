export type DireccionOrden = "asc" | "desc"

const COLADOR = new Intl.Collator("es-AR", { numeric: true, sensitivity: "base" })

function esVacio(valor: unknown): boolean {
  return valor === null || valor === undefined || valor === ""
}

export function ordenarPor<T extends Record<string, unknown>>(
  items: T[],
  campo: string,
  direccion: DireccionOrden
): T[] {
  const factor = direccion === "asc" ? 1 : -1

  return [...items].sort((x, y) => {
    const a = x[campo]
    const b = y[campo]

    if (esVacio(a) && esVacio(b)) return 0
    if (esVacio(a)) return 1
    if (esVacio(b)) return -1

    if (typeof a === "number" && typeof b === "number") return (a - b) * factor
    return COLADOR.compare(String(a), String(b)) * factor
  })
}
