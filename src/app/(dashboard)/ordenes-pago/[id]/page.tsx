import { OrdenPagoDetails } from "@/views/orden-pago-details"
import { requirePagePermission } from "@/shared/permissions-server"

export default async function OrdenPagoDetailPage() {
  await requirePagePermission("ordenes_pago", "ver")
  return <OrdenPagoDetails />
}
