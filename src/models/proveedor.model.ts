export interface Proveedor {
  id: string
  nombre: string
  rfc: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  pais: string | null
  estado: string
  sitio_web?: string | null
  notas?: string | null
  created_at: string
  updated_at: string
}

export enum EstadoProveedor {
  ACTIVO = "Activo",
  INACTIVO = "Inactivo",
  SUSPENDIDO = "Suspendido"
}

export interface CreateProveedorData {
  nombre: string
  rfc?: string | null
  email?: string | null
  telefono?: string | null
  direccion?: string | null
  ciudad?: string | null
  pais?: string | null
  sitio_web?: string | null
  notas?: string | null
}

export interface UpdateProveedorData extends Partial<CreateProveedorData> {
  estado?: string
}
