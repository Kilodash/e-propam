import { createServerClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import DetailTabs from "@/components/pengaduan/detail-tabs"
import type { Pengaduan, TimelineEntry } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PengaduanDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan

  const { data: timeline } = await supabase
    .from("timeline")
    .select("*")
    .eq("prepetrator_id", p.prepetrator_id)
    .order("date_activity", { ascending: true })

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

      <DetailTabs pengaduan={p} timeline={(timeline as TimelineEntry[]) ?? []} />
    </div>
  )
}
