// Acceso a datos SIEMPRE vía API routes (el browser no habla con Supabase — RLS niega anon).
// Único wrapper de fetch del cliente: si la respuesta no es ok, lanza Error con el mensaje
// del body (`{ error }`, que setea handleRouteError) para que el hook lo muestre en un toast.
// Las rutas dedicadas (activar/suspender/estado) también pasan por acá.
export async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}
