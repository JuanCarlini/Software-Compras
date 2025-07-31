export interface Proveedor {
  id: string
  nombre: string
  rut: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  pais: string
  estado: EstadoProveedor
  contacto_principal: string
  sitio_web?: string
  notas?: string
  created_at: Date
  updated_at: Date
}

export enum EstadoProveedor {
  ACTIVO = "Activo",
  INACTIVO = "Inactivo",
  SUSPENDIDO = "Suspendido"
}

export interface CreateProveedorData {
  nombre: string
  rut: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  pais: string
  contacto_principal: string
  sitio_web?: string
  notas?: string
}

export interface UpdateProveedorData extends Partial<CreateProveedorData> {
  estado?: EstadoProveedor
}
