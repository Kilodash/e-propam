import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import DetailTabs from "@/components/pengaduan/detail-tabs"
import CatatanForm from "@/components/pengaduan/catatan-form"
import TimelineStepper from "@/components/pengaduan/timeline-stepper"
import AksiYanduan from "@/components/pengaduan/aksi-yanduan"
import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getUnifiedTimeline } from "@/lib/timeline-merge"
import type { Pengaduan } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PengaduanDetailPage({ params }: PageProps) {
  const { id } = await params
  const c = await cookies()
  const devRole = c.get("dev-role")?.value ?? "yanduan"
  const devEmail = c.get("dev-email")?.value ?? "propam.polda@polri.go.id"

  const supabase = createServiceClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan

  const items = await getUnifiedTimeline(p.prepetrator_id).catch(() => [])

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">#{p.id}</h2>
          <p className="text-gray-400 text-sm">
            {p.pengirim ?? "Tidak diketahui"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <DetailTabs pengaduan={p} timeline={[]} />
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Catatan ({items.length})</h3>
            <TimelineStepper items={items} />
            <CatatanForm
              pengaduanId={p.id}
              prepetratorId={p.prepetrator_id}
              authorEmail={devEmail}
              authorRole={devRole}
            />
          </div>
        </div>
        <div>
          <AksiYanduan
            pengaduanId={p.id}
            prepetratorId={p.prepetrator_id}
            currentSaran={p.saran_kabid}
          />
        </div>
      </div>
    </div>
  )
}
