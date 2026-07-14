import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import DetailTabs from "@/components/pengaduan/detail-tabs"
import AksiYanduan from "@/components/pengaduan/aksi-yanduan"
import { createServiceClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getTimelineFromGajamada } from "@/lib/gajamada/timeline"
import type { Pengaduan, TimelineEntry } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PengaduanDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan

  // Fetch timeline langsung dari Gajamada
  const timeline = await getTimelineFromGajamada(p.prepetrator_id)

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
        <div className="lg:col-span-2">
          <DetailTabs pengaduan={p} timeline={(timeline as TimelineEntry[]) ?? []} />
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
