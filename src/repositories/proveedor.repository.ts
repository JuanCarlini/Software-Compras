import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types"
import { Proveedor } from "@/models"
import { createBaseRepository } from "./base.repository"

// Repositorio de gu_proveedores: CRUD estándar (A1) — findAll/findById/insert/update/delete
// idénticos al patrón base. Solo I/O; la normalización de estado y los defaults viven en
// ProveedorService. Ver base.repository para la semántica (throw/null/bool).
export const ProveedorRepository = createBaseRepository<
  Proveedor,
  TablesInsert<"gu_proveedores">,
  TablesUpdate<"gu_proveedores">
>("gu_proveedores")
