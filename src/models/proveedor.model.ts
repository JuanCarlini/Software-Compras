import type { Database } from "@/lib/supabase/database.types"

// El enum de la DB (estado_activo_inactivo) solo tiene activo/inactivo: "suspender"
// en la UI escribe 'inactivo'. Ver discrepancia #10 de CLAUDE.md.
export enum EstadoProveedor {
  ACTIVO = "activo",
  INACTIVO = "inactivo",
}

export type Proveedor = Database["public"]["Tables"]["gu_proveedores"]["Row"]
export type CreateProveedorData = Omit<
  Database["public"]["Tables"]["gu_proveedores"]["Insert"],
  "id" | "estado" | "created_at"
>
