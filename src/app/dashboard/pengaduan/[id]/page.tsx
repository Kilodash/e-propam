import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import DetailTabs from "@/components/pengaduan/detail-tabs"
import CatatanForm from "@/components/pengaduan/catatan-form"
import AksiYanduan from "@/components/pengaduan/aksi-yanduan"
import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect, notFound } from "next/navigation"
import { getUnifiedTimeline } from "@/lib/timeline-merge"
import type { Pengaduan } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PengaduanDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const role = user.role
  const userEmail = user.email ?? "propam.polda@polri.go.id"

  const supabase = createServiceClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan
  const timelineItems = await getUnifiedTimeline(p.prepetrator_id)
  const gajamada = timelineItems.filter(i => i.kind === "gajamada").map(i => i.entry as import("@/types").TimelineEntry)

  return (
    <div className="pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard/yanduan">
          <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </Link>
      </div>

      <DetailTabs pengaduan={p} timeline={gajamada} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <CatatanForm
          pengaduanId={id}
          prepetratorId={p.prepetrator_id}
          authorEmail={userEmail}
          authorRole={role}
        />
        <AksiYanduan prepetratorId={p.prepetrator_id} pengaduanId={id} />
      </div>
    </div>
  )
}
