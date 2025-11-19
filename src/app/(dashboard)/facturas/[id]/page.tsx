"use client"

import { FacturaDetail } from "@/views/factura-detail"

export default function FacturaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <FacturaDetail params={params} />
}
