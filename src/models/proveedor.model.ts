// como en la base está en minúsculas:
export enum EstadoProveedor {
  ACTIVO = "activo",
  INACTIVO = "inactivo",
}

export interface Proveedor {
  id: number;               // bigint
  nombre: string;
  cuit: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  estado: EstadoProveedor | null;  // puede venir null pero default es 'activo'
  created_at: string;       // timestamp
  // no hay updated_at en la tabla que me pasaste
}
