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
  searchParams: Promise<{ unit?: string }>
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

  // Build queue — match the same data source as the dashboard for this role
  let total: number | null = null
  let queue: string[] = []
  const scope = "all"

  // Resolve unit filter to case_positions for queue filtering
  let filterPositions: string[] | null = null
  if (unitFilter) {
    const { data: unitRows } = await supabase
      .from("unit_mapping")
      .select("gajamada_name, normalized_name, police_function")
      .eq("is_active", true)

    if (unitRows) {
      const isSubbidRole = ["paminal", "provos", "wabprof", "rehabpers"].includes(role)
      if (isSubbidRole) {
        // For subbid, use the same grouping as unit dashboard (BINPAM/PRODOK/LITPERS)
        const policeFn = ({ paminal: "PAMINAL", provos: "PROVOS", wabprof: "WABPROF", rehabpers: "REHABPERS" } as Record<string, string>)[role]
        const subbidUnits = unitRows.filter((r: any) => r.police_function === policeFn)

        // Find which group this unit belongs to
        const target = subbidUnits.find((r: any) => r.gajamada_name === unitFilter)
        if (target) {
          const getName = (g: string) => g.toUpperCase()
          const getGroup = (g: string) => {
            if (g.startsWith("KASUBBID ")) return "KASUBBID"
            if (g.startsWith("KAUR BINPAM") || g.startsWith("UR BINPAM")) return "BINPAM"
            if (g.startsWith("KAUR PRODOK") || g.startsWith("UR PRODOK")) return "PRODOK"
            if (g.startsWith("KAUR LITPERS") || g.startsWith("UR LITPERS")) return "LITPERS"
            const m = g.match(/^(UNIT\s+\d+)/i)
            if (m) return m[1].toUpperCase()
            return g.split(" ")[0]
          }
          const targetGroup = getGroup(getName(target.gajamada_name))
          filterPositions = subbidUnits
            .filter((r: any) => getGroup(getName(r.gajamada_name)) === targetGroup)
            .map((r: any) => r.gajamada_name)
        }
      } else {
        const target = unitRows.find((r: any) => r.gajamada_name === unitFilter)
        if (target) {
          filterPositions = unitRows
            .filter((r: any) => r.normalized_name === target.normalized_name)
            .map((r: any) => r.gajamada_name)
        } else {
          filterPositions = [unitFilter]
        }
      }
    }
  }

  async function fetchQueue(positions: string[] | null) {
    const q = supabase.from("pengaduan").select("id")
    
    // Merge scope + filter: use filterPositions if set, otherwise use positions
    const finalPositions = filterPositions && filterPositions.length > 0
      ? filterPositions
      : positions
    
    if (finalPositions && finalPositions.length > 0) {
      // Include both case_position AND previous_case_position (riwayat)
      const or = finalPositions.map(p =>
        `case_position.eq."${p}",previous_case_position.eq."${p}"`
      ).join(",")
      q.or(or)
    }
    // yanduan/kabid/admin: all polda jabar
    if (role === "yanduan" || role === "kabid" || role === "admin") {
      q.eq("polda_code", 6013)
    }
    q.order("created_date", { ascending: false })
    const { data: list } = await q
    return ((list ?? []) as { id: string }[]).map(r => r.id)
  }

  if (role === "yanduan" || role === "kabid" || role === "admin") {
    queue = await fetchQueue(null)
    total = queue.length
  } else {
    // Regular unit member: only their own unit
    if (!isLeadership && userUnitName) {
      queue = await fetchQueue([userUnitName])
      total = queue.length
    } else {
      const SUBBID_SCOPE: Record<string, string> = {
        paminal: "KASUBBID PAMINAL POLDA JAWA BARAT",
        provos: "KASUBBID PROVOS POLDA JAWA BARAT",
        wabprof: "KASUBBID WABPROF POLDA JAWA BARAT",
        rehabpers: "KASUBBAG REHABPERS POLDA JAWA BARAT",
      }
      const leadershipPos = SUBBID_SCOPE[role]
      if (leadershipPos) {
        queue = await fetchQueue([leadershipPos])
        total = queue.length
      } else {
        const policeFnMap: Record<string, string> = { paminal: "PAMINAL", provos: "PROVOS", wabprof: "WABPROF", rehabpers: "REHABPERS" }
        const policeFn = policeFnMap[role]
        if (policeFn) {
          const { data: units } = await supabase.from("unit_mapping").select("gajamada_name").eq("police_function", policeFn).eq("is_active", true)
          const positions = (units ?? []).map((u: { gajamada_name: string }) => u.gajamada_name)
          queue = await fetchQueue(positions)
          total = queue.length
        }
      }
    }
  }

  const idx = queue.indexOf(p.id)
  const position = idx >= 0 ? idx + 1 : 1
  const totalCount = total ?? queue.length
  const prevId = idx > 0 ? queue[idx - 1] : null
  const nextId = idx < queue.length - 1 ? queue[idx + 1] : null

  const unitParam = unitFilter ? `?unit=${encodeURIComponent(unitFilter)}` : ""

  return (
    <div className="pb-12 h-[calc(100vh-122px)] flex flex-col">
      <div
        className="grid gap-3 flex-1 min-h-0"
        style={{ gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto 1fr" }}
      >
        <div className="col-start-1 col-end-2 self-stretch">
          <DetailDasar pengaduanId={p.id} pengaduan={p} />
        </div>

        <div className="col-start-2 col-end-3 flex flex-col gap-3 h-full">
          <DetailPelapor pengaduan={p} reportCountPolda={reportCountPolda} reportCountNasional={reportCountNasional} />
          <div className="flex-1 min-h-0 flex flex-col">
            <DetailTerlapor pengaduan={p} />
          </div>
        </div>

        <div className="col-start-3 col-end-4 row-start-1 row-end-3 flex flex-col gap-3 min-h-0">
          <div className="flex-1 min-h-0">
            <AksiCardRenderer role={role} pengaduanId={p.id} prepetratorId={p.prepetrator_id} pengaduan={p} isLeadership={isLeadership} />
          </div>
        </div>

        <div className="col-start-1 col-end-2 row-start-2 row-end-3 min-h-0">
          <TimelineCard key={Date.now()} prepetratorId={p.prepetrator_id} pengaduanId={p.id} authorEmail={userEmail} authorRole={role} />
        </div>

        <div className="col-start-2 col-end-3 row-start-2 row-end-3 min-h-0">
          <BuktiPendukung prepetratorId={p.prepetrator_id} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-gray-700 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <Link
              href={queue[0] ? `${dashboardHref}/${queue[0]}${unitParam}` : "#"}
              aria-label="Antrian pertama"
              className={`p-1.5 rounded ${queue[0] && queue[0] !== p.id ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Link>
            <Link
              href={prevId ? `${dashboardHref}/${prevId}${unitParam}` : "#"}
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
              href={nextId ? `${dashboardHref}/${nextId}${unitParam}` : "#"}
              aria-label="Selanjutnya"
              className={`flex items-center gap-1 px-2 py-1 rounded ${nextId ? "hover:bg-gray-700" : "opacity-40 pointer-events-none"}`}
            >
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href={queue[queue.length - 1] ? `${dashboardHref}/${queue[queue.length - 1]}${unitParam}` : "#"}
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
