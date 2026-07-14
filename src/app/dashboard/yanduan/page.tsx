import { createServiceClient } from "@/lib/supabase/server"
import MetricCards from "@/components/dashboard/metric-cards"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import type { Pengaduan } from "@/types"

const YANDUAN_POSITIONS = [
  "KASUBBAG YANDUAN POLDA JAWA BARAT",
  "OPERATOR YANDUAN POLDA JAWA BARAT",
]

export default async function YanduanDashboardPage() {
  const supabase = createServiceClient()
  const result = await supabase
    .from("pengaduan")
    .select("*")
    .in("case_position", YANDUAN_POSITIONS)
    .order("created_date", { ascending: false })

  if (result.error) {
    return <p className="text-red-400 p-6">Gagal memuat data: {result.error.message}</p>
  }

  const list = (result.data as Pengaduan[]) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard Yanduan</h2>
        <div className="flex gap-2">
          <a href="/dashboard/disposisi" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded">
            Disposisi ({list.filter(p => !p.saran_kabid).length} antrian)
          </a>
        </div>
      </div>
      <MetricCards
        cards={[
          { label: "Total Pengaduan", value: list.length },
          { label: "Belum Disposisi", value: list.filter(p => p.status_label?.includes("Diterima") || p.status_label?.includes("Dikirim")).length, variant: "warning" as const },
          { label: "Diproses", value: list.filter(p => !p.status_label?.includes("Diterima") && !p.status_label?.includes("Dikirim") && !p.status_label?.includes("Selesai") && !p.status_label?.includes("Terbukti")).length, variant: "default" as const },
          { label: "Selesai", value: list.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti")).length, variant: "success" as const },
        ]}
      />
      <PengaduanTable
        data={list}
        showAksi={true}
        aksiLabel="Proses"
        filterOptions={{
          categories: Array.from(new Set(list.map(p => p.category).filter((c): c is string => Boolean(c)))),
          statuses: Array.from(new Set(list.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: Array.from(new Set(list.map(p => p.disposisi_polres).filter((u): u is string => Boolean(u)))),
        }}
      />
    </div>
  )
}
