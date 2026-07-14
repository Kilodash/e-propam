import { createServiceClient } from "@/lib/supabase/server"
import Link from "next/link"
import MetricCards from "@/components/dashboard/metric-cards"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import { groupUnitsByNormalizedName } from "@/lib/unit-search"
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
    .eq("polda_code", 6013)
    .order("created_date", { ascending: false })

  const unitsResult = await supabase
    .from("unit_mapping")
    .select("gajamada_name, normalized_name, satker_level")
    .eq("is_active", true)

  if (result.error) {
    return <p className="text-red-400 p-6">Gagal memuat data: {result.error.message}</p>
  }

  const list = (result.data as Pengaduan[]) ?? []
  const unitOptions = groupUnitsByNormalizedName(
    (unitsResult.data ?? []) as { gajamada_name: string; normalized_name: string; satker_level: string }[]
  )
  const antrian = list.filter(p => YANDUAN_POSITIONS.includes(p.case_position ?? "") && !p.saran_kabid)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">Dashboard Yanduan</h2>
        <div className="flex gap-2">
          <Link href="/dashboard/disposisi" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded">
            Disposisi ({antrian.length} antrian)
          </Link>
        </div>
      </div>
      <div className="flex-shrink-0">
        <MetricCards
          cards={[
            { label: "Total Pengaduan", value: list.length },
            { label: "Antrian Yanduan", value: antrian.length, variant: "warning" as const },
            { label: "Selesai", value: list.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti") || p.status_label?.includes("Perdamaian")).length, variant: "success" as const },
            { label: "Dalam Proses", value: list.filter(p => p.status_label?.includes("Lidik") || p.status_label?.includes("Gelar") || p.status_label?.includes("Perdamaian")).length, variant: "default" as const },
          ]}
        />
      </div>
      <PengaduanTable
        data={list}
        showAksi={true}
        aksiLabel="Lihat"
        aksiHref="/dashboard/disposisi"
        filterOptions={{
          statuses: Array.from(new Set(list.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}
