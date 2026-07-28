import { createClient } from "@/lib/supabase/service"

// El cliente tipado exige un literal de tabla en .from() (unión de nombres) y el Insert
// exacto de esa tabla. Este repo es GENÉRICO sobre la tabla, así que adentro se usa el
// cliente sin tipar: la seguridad de tipos vive en el borde (generics Row/Insert/Update
// + el export tipado por repo, p.ej. createBaseRepository<Proveedor,...>).
type UntypedClient = {
  from: (table: string) => any
}
function db(): UntypedClient {
  return createClient() as unknown as UntypedClient
}

// CRUD genérico compartido por los repos cuya tabla tiene PK `id` y el patrón estándar.
// Semántica FIJA — solo la adoptan los repos que la comparten exacto:
//   findAll  → throw si error, [] si no hay filas
//   findById → null si error/no encontrado
//   insert   → throw si error (deja subir 23505/23503 a handleRouteError)
//   update   → null si error/no encontrado
//   delete   → bool (!error)
// Los repos con selects custom (SELECT_SIN_HASH), maybeSingle, o update/delete que
// tiran en vez de devolver null/bool NO usan esto: su semántica difiere y forzarla acá
// sería una abstracción con demasiados flags. Componen sus métodos custom aparte.
export interface BaseRepositoryOptions {
  orderBy?: { column: string; ascending?: boolean }
}

export function createBaseRepository<Row, Insert = Partial<Row>, Update = Partial<Row>>(
  table: string,
  opts: BaseRepositoryOptions = {}
) {
  const order = opts.orderBy ?? { column: "created_at", ascending: false }

  return {
    async findAll(): Promise<Row[]> {
      const supabase = db()
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(order.column, { ascending: order.ascending ?? false })

      if (error) throw error
      return (data ?? []) as Row[]
    },

    async findById(id: number): Promise<Row | null> {
      const supabase = db()
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single()
      if (error) return null
      return data as Row
    },

    async insert(row: Insert): Promise<Row> {
      const supabase = db()
      const { data, error } = await supabase.from(table).insert(row).select().single()
      if (error) throw error
      return data as Row
    },

    async update(id: number, row: Update): Promise<Row | null> {
      const supabase = db()
      const { data, error } = await supabase.from(table).update(row).eq("id", id).select().single()
      if (error) return null
      return data as Row
    },

    async delete(id: number): Promise<boolean> {
      const supabase = db()
      const { error } = await supabase.from(table).delete().eq("id", id)
      return !error
    },
  }
}
