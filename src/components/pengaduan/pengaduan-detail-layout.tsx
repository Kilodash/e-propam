import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Printer } from "lucide-react"
import { DetailDasar, DetailPelapor, DetailTerlapor } from "@/components/pengaduan/detail-gajamada"
import TimelineCard from "@/components/pengaduan/timeline-card"
import BuktiTabs from "@/components/pengaduan/bukti-tabs"
import AksiCardRenderer from "@/components/aksi-cards/aksi-card-renderer"
import { countByNik } from "@/lib/gajamada/client"
import type { Pengaduan } from "@/types"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ unit?: string; status?: string; q?: string }>
  role: string
  userEmail: string
  isLeadership: boolean
  userUnitName: string | null
  dashboardHref: string
}

export default async function PengaduanDetailLayout({ params, searchParams, role, userEmail, isLeadership, userUnitName, dashboardHref }: Props) {
  const { id } = await params
  const sp = await searchParams
  const unitFilter = sp.unit ?? null
  const statusFilter = sp.status ?? null
  const searchFilter = sp.q ?? null

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
      Promise.race([
        countByNik(p.reporter_nik),
        new Promise<number>(r => setTimeout(() => r(0), 5000))
      ]).catch(() => 0),
    ])
    reportCountPolda = localCount ?? 0
    reportCountNasional = nationalCount
  }

  // Build queue — same query logic as unit dashboard page
  let queue: string[] = []
  const policeFnMap: Record<string, string> = { paminal: "PAMINAL", provos: "PROVOS", wabprof: "WABPROF", rehabpers: "REHABPERS" }
  const SUBBID_SCOPE: Record<string, string> = {
    paminal: "KASUBBID PAMINAL POLDA JAWA BARAT",
    provos: "KASUBBID PROVOS POLDA JAWA BARAT",
    wabprof: "KASUBBID WABPROF POLDA JAWA BARAT",
    rehabpers: "KASUBBAG REHABPERS POLDA JAWA BARAT",
  }

  async function fetchQueueByScope(): Promise<string[]> {
    const q = supabase.from("pengaduan").select("id, status_label, prepetrator_name, pengirim, summary, content, case_position")
    const policeFn = policeFnMap[role]
    if (!isLeadership && userUnitName) {
      q.or(`case_position.eq."${userUnitName}",previous_case_position.eq."${userUnitName}"`)
    } else if (["yanduan", "kabid", "admin"].includes(role)) {
      q.eq("polda_code", 6013)
    } else if (policeFn) {
      const { data: scopeUnits } = await supabase.from("unit_mapping").select("gajamada_name").eq("police_function", policeFn).eq("is_active", true).eq("satker_level", "subbid")
      const positions = (scopeUnits ?? []).map((u: any) => u.gajamada_name)
      if (positions.length > 0) {
        q.or(positions.map((p: string) => `case_position.eq."${p}",previous_case_position.eq."${p}"`).join(","))
      } else {
        q.eq("disposisi_police_function", policeFn)
      }
    }
    // Apply unit filter from dashboard table
    if (unitFilter) {
      q.eq("case_position", unitFilter)
    }
    q.order("updated_at", { ascending: false })
    const { data: list } = await q
    const all = ((list ?? []) as { id: string; status_label: string; prepetrator_name?: string; pengirim?: string; summary?: string; content?: string; case_position?: string }[])
    // Filter by status + search in memory
    let ids = all.filter(r => {
      if (statusFilter && r.status_label !== statusFilter && r.id !== id) return false
      if (searchFilter) {
        const q = searchFilter.toLowerCase()
        const hit = [r.id, r.prepetrator_name, r.pengirim, r.summary, r.content, r.status_label, r.case_position]
          .some(f => f && f.toLowerCase().includes(q))
        if (!hit && r.id !== id) return false
      }
      return true
    }).map(r => r.id)
    if (!ids.includes(id)) ids.push(id)
    return ids
  }

  queue = await fetchQueueByScope()
  const total = queue.length

  const idx = queue.indexOf(p.id)
  const position = idx >= 0 ? idx + 1 : 1
  const totalCount = total
  const prevId = idx > 0 ? queue[idx - 1] : null
  const nextId = idx < queue.length - 1 ? queue[idx + 1] : null

  const qp = new URLSearchParams()
  if (unitFilter) qp.set("unit", unitFilter)
  if (statusFilter) qp.set("status", statusFilter)
  if (searchFilter) qp.set("q", searchFilter)
  const navParams = qp.toString() ? `?${qp.toString()}` : ""

  return (
    <div className="pb-12 h-[calc(100vh-122px)] flex flex-col">
      <div
        className="grid gap-3 flex-1 min-h-0"
        style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)", gridTemplateRows: "auto 1fr" }}
      >
        <div className="col-start-1 col-end-2 self-stretch">
          <DetailDasar pengaduanId={p.id} pengaduan={p} />
        </div>

        <div className="col-start-2 col-end-3 flex flex-col gap-3 h-full">
          <DetailPelapor pengaduan={p} reportCountPolda={reportCountPolda} reportCountNasional={reportCountNasional}
            action={
              <a
                href={`/cetak/${p.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#0369A1] hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Cetak Lembar Informasi"
              >
                <Printer className="w-3 h-3" /> Cetak
              </a>
            }
          />
          <div className="flex-1 min-h-0 flex flex-col">
            <DetailTerlapor pengaduan={p} />
          </div>
        </div>

        <div className="col-start-3 col-end-4 row-start-1 row-end-3 flex flex-col gap-3 min-h-0">
          <AksiCardRenderer role={role} pengaduanId={p.id} prepetratorId={p.prepetrator_id} pengaduan={p} isLeadership={isLeadership} />
        </div>

        <div className="col-start-1 col-end-2 row-start-2 row-end-3 min-h-0">
          <TimelineCard key={Date.now()} prepetratorId={p.prepetrator_id} pengaduanId={p.id} authorEmail={userEmail} authorRole={role} />
        </div>

        <div className="col-start-2 col-end-3 row-start-2 row-end-3 h-full min-h-0">
          <BuktiTabs prepetratorId={p.prepetrator_id} pengaduanId={p.id} className="h-full" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Link
              href={queue[0] ? `${dashboardHref}/${queue[0]}${navParams}` : "#"}
              aria-label="Antrian pertama"
              className={`p-1.5 rounded ${queue[0] && queue[0] !== p.id ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Link>
            <Link
              href={prevId ? `${dashboardHref}/${prevId}${navParams}` : "#"}
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
              href={nextId ? `${dashboardHref}/${nextId}${navParams}` : "#"}
              aria-label="Selanjutnya"
              className={`flex items-center gap-1 px-2 py-1 rounded ${nextId ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href={queue[queue.length - 1] ? `${dashboardHref}/${queue[queue.length - 1]}${navParams}` : "#"}
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
