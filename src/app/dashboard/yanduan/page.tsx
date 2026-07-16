import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import MetricCards from "@/components/dashboard/metric-cards"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import { groupUnitsByNormalizedName } from "@/lib/unit-search"
import type { Pengaduan } from "@/types"

export default async function YanduanDashboardPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== "yanduan" && user.role !== "admin")) redirect("/login")

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <MetricCards
          cards={[
            { label: "Total Pengaduan", value: list.length },
            { label: "Belum Disposisi", value: list.filter(p => !p.saran_kabid).length, variant: "warning" as const },
            { label: "Selesai", value: list.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti")).length, variant: "success" as const },
            { label: "Dalam Proses", value: list.filter(p => p.status_label?.includes("Lidik") || p.status_label?.includes("Gelar")).length, variant: "default" as const },
          ]}
        />
      </div>
      <PengaduanTable
        data={list}
        showAksi
        aksiLabel="Disposisi"
        aksiHref="/dashboard/disposisi"
        title="Dashboard Yanduan"
        filterOptions={{
          statuses: Array.from(new Set(list.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}
