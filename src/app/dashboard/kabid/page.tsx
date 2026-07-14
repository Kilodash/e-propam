import { createServiceClient } from "@/lib/supabase/server"
import MetricCards from "@/components/dashboard/metric-cards"
import KinerjaTable from "@/components/dashboard/kinerja-table"
import LimphanTable from "@/components/dashboard/limphan-table"
import type { Pengaduan } from "@/types"

export default async function KabidDashboardPage() {
  const supabase = createServiceClient()
  const result = await supabase
    .from("pengaduan")
    .select("*")
    .order("created_date", { ascending: false })

  if (result.error) {
    return <p className="text-red-400 p-6">Gagal memuat data: {result.error.message}</p>
  }

  const list = (result.data as Pengaduan[]) ?? []
  const selesai = list.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti"))
  const lambat = list.filter(p => !p.status_label?.includes("Selesai") && p.created_date && Date.now() - new Date(p.created_date).getTime() > 30 * 86400000)
  const slimphan = list.filter(p => p.status_label?.includes("Limpah") || p.status_label?.includes("Wassidik") || p.disposisi_police_function === "WASSIDIK")

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Kabid Propam</h2>
      <MetricCards
        cards={[
          { label: "Total Pengaduan", value: list.length },
          { label: "Dalam Proses", value: list.length - selesai.length, variant: "warning" as const },
          { label: "Lambat (>30 hari)", value: lambat.length, variant: "danger" as const },
          { label: "Selesai", value: selesai.length, variant: "success" as const },
        ]}
      />
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Kinerja Satker</h3>
        <KinerjaTable data={list} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          Limpahan ke Wassidik ({slimphan.length})
        </h3>
        <LimphanTable data={slimphan} />
      </div>
    </div>
  )
}
