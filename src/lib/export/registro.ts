import type { EstrategiaExport } from "./tipos"
import { ExportCsv } from "./csv"
import { ExportXlsx } from "./xlsx"

// Registry: agregar un formato es una clase y una linea aca. Ningun condicional
// por formato desperdigado por las rutas.
export const ESTRATEGIAS: Record<string, EstrategiaExport> = {
  csv: new ExportCsv(),
  xlsx: new ExportXlsx(),
}
