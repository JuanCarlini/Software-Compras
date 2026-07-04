"use client"

import { CertificacionDetail } from "@/views/certificacion-detail"

export default function CertificacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <CertificacionDetail params={params} />
}
