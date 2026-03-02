import { OrdenPagoDetails } from "@/views/orden-pago-details"

interface Props {
  params: Promise<{ id: string }>
}

export default function OrdenPagoDetailPage({ params }: Props) {
  return <OrdenPagoDetails />
}
