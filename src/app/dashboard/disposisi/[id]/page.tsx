import { createServiceClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"
import LembarDisposisi from "@/components/pengaduan/lembar-disposisi"
import DetailTabs from "@/components/pengaduan/detail-tabs"
import TimelineStepper from "@/components/pengaduan/timeline-stepper"
import ExpandableText from "@/components/pengaduan/expandable-text"
import { format } from "date-fns"
import { getTimelineFromGajamada } from "@/lib/gajamada/timeline"
import type { Pengaduan, TimelineEntry } from "@/types"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LembarDisposisiPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan

  // Fetch timeline: coba Gajamada dulu, fallback ke Supabase kalau gagal
  let timeline: TimelineEntry[] = []
  try {
    const gajamadaTimeline = await getTimelineFromGajamada(p.prepetrator_id)
    if (gajamadaTimeline.length > 0) {
      timeline = gajamadaTimeline
    } else {
      // Fallback ke Supabase
      const { data: localTimeline } = await supabase
        .from("timeline")
        .select("*")
        .eq("prepetrator_id", p.prepetrator_id)
        .order("date_activity", { ascending: true })
      timeline = (localTimeline as TimelineEntry[]) ?? []
    }
  } catch (e) {
    console.error("Timeline fetch failed:", e)
    const { data: localTimeline } = await supabase
      .from("timeline")
      .select("*")
      .eq("prepetrator_id", p.prepetrator_id)
      .order("date_activity", { ascending: true })
    timeline = (localTimeline as TimelineEntry[]) ?? []
  }

  // count siblings
  const { count: total } = await supabase
    .from("pengaduan")
    .select("*", { count: "exact", head: true })
    .in("case_position", ["KASUBBAG YANDUAN POLDA JAWA BARAT", "OPERATOR YANDUAN POLDA JAWA BARAT"])

  const { data: antrian } = await supabase
    .from("pengaduan")
    .select("id")
    .in("case_position", ["KASUBBAG YANDUAN POLDA JAWA BARAT", "OPERATOR YANDUAN POLDA JAWA BARAT"])

  const queue = ((antrian ?? []) as { id: string }[]).map((r) => r.id)
  const idx = queue.indexOf(p.id)
  const position = idx >= 0 ? idx + 1 : 1
  const totalCount = total ?? queue.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/yanduan">
            <button className="text-white text-sm hover:text-blue-400">← Kembali ke menu utama</button>
          </Link>
          <h2 className="text-xl font-bold text-white">Disposisi</h2>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard/disposisi?tab=antrian" className="text-white hover:text-blue-400">
            Antrian
          </Link>
          <Link href="/dashboard/disposisi?tab=riwayat" className="text-gray-400 hover:text-blue-400">
            Riwayat
          </Link>
        </div>
        <Link href={`/dashboard/disposisi/${p.id}`}>
          <button className="text-gray-400 text-sm hover:text-white flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">SURAT #1 DARI 6</span>
              <span className="font-mono text-sm font-semibold text-gray-900">{p.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">SURAT</div>
                <div className="font-mono text-sm font-semibold text-gray-900">{p.prepetrator_id}</div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{p.source ?? "Master Unit"}</div>
                <span className="inline-block bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded mt-1">
                  {p.source_alias ?? "SUMBER SURAT DUMAS"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Info Surat</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">KATEGORI</p>
                <p className="text-gray-900 uppercase font-medium">{p.category ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">DITERIMA</p>
                <p className="text-gray-900">
                  {p.created_date ? format(new Date(p.created_date), "dd MMM yyyy") : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">NO SURAT</p>
                <p className="text-gray-900 font-mono text-xs">{p.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">JENIS</p>
                <p className="text-gray-900">{p.source_alias ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">PENGIRIM</p>
                <p className="text-gray-900 font-medium">{p.pengirim ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">TELP</p>
                <p className="text-gray-900">{p.phone_no ?? "-"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Kronologi</h3>
            <ExpandableText text={p.summary ?? p.content} maxLines={5} className="text-sm text-gray-700" />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Timeline ({(timeline as TimelineEntry[])?.length ?? 0})</h3>
            <TimelineStepper entries={(timeline as TimelineEntry[]) ?? []} />
          </div>
        </div>

        <div className="space-y-4">
          <LembarDisposisi
            pengaduanId={p.id}
            prepetratorId={p.prepetrator_id}
            saran={p.saran_kabid ?? ""}
            telaah={p.telaah ?? false}
            kelengkapan={p.kelengkapan ?? false}
            satkerTujuan={p.disposisi_satker_tujuan ?? ""}
            position={position}
            total={totalCount}
            prevId={idx > 0 ? queue[idx - 1] : null}
            nextId={idx < queue.length - 1 ? queue[idx + 1] : null}
          />
        </div>
      </div>
    </div>
  )
}
