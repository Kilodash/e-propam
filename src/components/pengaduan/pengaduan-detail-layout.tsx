import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DetailDasar, DetailPelapor, DetailTerlapor } from "@/components/pengaduan/detail-gajamada"
import TimelineCard from "@/components/pengaduan/timeline-card"
import BuktiPendukung from "@/components/pengaduan/bukti-pendukung"
import AksiCardRenderer from "@/components/aksi-cards/aksi-card-renderer"
import { countByNik } from "@/lib/gajamada/client"
import type { Pengaduan } from "@/types"

interface Props {
  params: Promise<{ id: string }>
  role: string
  dashboardHref: string
}

export default async function PengaduanDetailLayout({ params, role, dashboardHref }: Props) {
  const { id } = await params
  const c = await cookies()
  const devEmail = c.get("dev-email")?.value ?? `${role}@propam.polri.go.id`

  const supabase = createServiceClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !pengaduan) notFound()

  const p = pengaduan as Pengaduan

  // Count reports by NIK — Polda Jabar + Nasional
  let reportCountPolda = 0
  let reportCountNasional = 0
  if (p.reporter_nik) {
    const [{ count: localCount }, nationalCount] = await Promise.all([
      supabase.from("pengaduan").select("*", { count: "exact", head: true }).eq("reporter_nik", p.reporter_nik),
      countByNik(p.reporter_nik).catch(() => 0),
    ])
    reportCountPolda = localCount ?? 0
    reportCountNasional = nationalCount
  }

  // Build queue based on role scope
  let total: number | null = null
  let queue: string[] = []
  const scopeCookie = c.get("scope")?.value
  const scope = scopeCookie === "self" ? "self" : "all"

  if (role === "yanduan" || role === "admin") {
    const result = await supabase
      .from("pengaduan")
      .select("*", { count: "exact", head: true })
      .in("case_position", ["KASUBBAG YANDUAN POLDA JAWA BARAT", "OPERATOR YANDUAN POLDA JAWA BARAT"])
    total = result.count

    const { data: list } = await supabase
      .from("pengaduan")
      .select("id")
      .in("case_position", ["KASUBBAG YANDUAN POLDA JAWA BARAT", "OPERATOR YANDUAN POLDA JAWA BARAT"])
    queue = ((list ?? []) as { id: string }[]).map(r => r.id)
  } else if (role === "kabid") {
    const result = await supabase
      .from("pengaduan")
      .select("*", { count: "exact", head: true })
      .eq("polda_code", 6013)
    total = result.count

    const { data: list } = await supabase
      .from("pengaduan")
      .select("id")
      .eq("polda_code", 6013)
    queue = ((list ?? []) as { id: string }[]).map(r => r.id)
  } else {
    // Subbid: queue based on scope
    const SUBBID_SCOPE: Record<string, string> = {
      paminal: "KASUBBID PAMINAL POLDA JAWA BARAT",
      provos: "KASUBBID PROVOS POLDA JAWA BARAT",
      wabprof: "KASUBBID WABPROF POLDA JAWA BARAT",
      rehabpers: "KASUBBAG REHABPERS POLDA JAWA BARAT",
    }
    const leadershipPos = SUBBID_SCOPE[role]
    if (scope === "self" && leadershipPos) {
      const result = await supabase.from("pengaduan").select("*", { count: "exact", head: true }).eq("case_position", leadershipPos)
      total = result.count
      const { data: list } = await supabase.from("pengaduan").select("id").eq("case_position", leadershipPos)
      queue = ((list ?? []) as { id: string }[]).map(r => r.id)
    } else {
      const policeFnMap: Record<string, string> = { paminal: "PAMINAL", provos: "PROVOS", wabprof: "WABPROF", rehabpers: "REHABPERS" }
      const policeFn = policeFnMap[role]
      if (policeFn) {
        const { data: units } = await supabase.from("unit_mapping").select("gajamada_name").eq("police_function", policeFn).eq("is_active", true)
        const positions = (units ?? []).map(u => u.gajamada_name)
        if (positions.length > 0) {
          const result = await supabase.from("pengaduan").select("*", { count: "exact", head: true }).in("case_position", positions)
          total = result.count
          const { data: list } = await supabase.from("pengaduan").select("id").in("case_position", positions)
          queue = ((list ?? []) as { id: string }[]).map(r => r.id)
        }
      }
    }
  }

  const idx = queue.indexOf(p.id)
  const position = idx >= 0 ? idx + 1 : 1
  const totalCount = total ?? queue.length
  const prevId = idx > 0 ? queue[idx - 1] : null
  const nextId = idx < queue.length - 1 ? queue[idx + 1] : null

  return (
    <div className="pb-12 h-[calc(100vh-122px)] flex flex-col">
      <div
        className="grid gap-3 flex-1 min-h-0"
        style={{ gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto 1fr" }}
      >
        <div className="col-start-1 col-end-2 self-stretch">
          <DetailDasar pengaduanId={p.id} pengaduan={p} />
        </div>

        <div className="col-start-2 col-end-3 flex flex-col gap-3">
          <DetailPelapor pengaduan={p} reportCountPolda={reportCountPolda} reportCountNasional={reportCountNasional} />
          <DetailTerlapor pengaduan={p} />
        </div>

        <div className="col-start-3 col-end-4 row-start-1 row-end-3 flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0">
            <AksiCardRenderer role={role} pengaduanId={p.id} prepetratorId={p.prepetrator_id} pengaduan={p} />
          </div>
        </div>

        <div className="col-start-1 col-end-2 row-start-2 row-end-3 min-h-0">
          <TimelineCard key={Date.now()} prepetratorId={p.prepetrator_id} pengaduanId={p.id} authorEmail={devEmail} authorRole={role} />
        </div>

        <div className="col-start-2 col-end-3 row-start-2 row-end-3 min-h-0">
          <BuktiPendukung prepetratorId={p.prepetrator_id} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-gray-700 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Link
              href={queue[0] ? `${dashboardHref}/${queue[0]}` : "#"}
              aria-label="Antrian pertama"
              className={`p-1.5 rounded ${queue[0] && queue[0] !== p.id ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Link>
            <Link
              href={prevId ? `${dashboardHref}/${prevId}` : "#"}
              aria-label="Sebelumnya"
              className={`flex items-center gap-1 px-2 py-1 rounded ${prevId ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              <ChevronLeft className="w-4 h-4" /> Sebelumnya
            </Link>
          </div>
          <div className="text-center">
            <span className="text-gray-400 text-xs">Antrian</span>
            <div className="font-mono text-white text-sm">{position} / {totalCount}</div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={nextId ? `${dashboardHref}/${nextId}` : "#"}
              aria-label="Selanjutnya"
              className={`flex items-center gap-1 px-2 py-1 rounded ${nextId ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href={queue[queue.length - 1] ? `${dashboardHref}/${queue[queue.length - 1]}` : "#"}
              aria-label="Antrian terakhir"
              className={`p-1.5 rounded ${queue[queue.length - 1] && queue[queue.length - 1] !== p.id ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              <ChevronsRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
