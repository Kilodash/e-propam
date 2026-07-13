import { createServerClient } from "@/lib/supabase/server"
import MetricCards from "@/components/dashboard/metric-cards"
import KinerjaTable from "@/components/dashboard/kinerja-table"
import LimphanTable from "@/components/dashboard/limphan-table"
import type { Pengaduan } from "@/types"

export default async function KabidDashboardPage() {
  const supabase = await createServerClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .order("created_date", { ascending: false })

  if (error) {
    return <p className="text-red-400">Gagal memuat data: {error.message}</p>
  }

  const list = pengaduan as Pengaduan[]
  const slimphan = list.filter((p) =>
    p.status_label?.includes("Limpah") || p.status_label?.includes("Wassidik") || p.disposisi_police_function === "WASSIDIK"
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Kabid Propam</h2>

      <MetricCards
        cards={[
          { label: "Total Pengaduan", value: list.length },
          { label: "Dalam Proses", value: list.filter((p) => !p.status_label?.includes("Selesai")).length, variant: "warning" },
          { label: "Lambat (>30 hari)", value: list.filter((p) => {
            if (!p.created_date || p.status_label?.includes("Selesai")) return false
            return Date.now() - new Date(p.created_date).getTime() > 30 * 86400000
          }).length, variant: "danger" },
          { label: "Selesai", value: list.filter((p) => p.status_label?.includes("Selesai")).length, variant: "success" },
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
