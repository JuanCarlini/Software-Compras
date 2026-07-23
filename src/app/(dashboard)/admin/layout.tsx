import { requirePageAdmin } from "@/lib/auth/permissions-server"

// Guarda server-side de toda la sección /admin/*. Antes era un "use client" que gateaba en
// useEffect: la UI se renderizaba y recién después de hidratar redirigía, así que con URL
// directa no bloqueaba nada (y sin JS, menos). Ahora el redirect ocurre en el servidor,
// antes de mandar la página. Los datos ya estaban protegidos aparte por requireAdmin en
// /api/admin/*: esto es defensa en profundidad.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePageAdmin()

  return <>{children}</>
}
