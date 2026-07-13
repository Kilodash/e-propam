import { createServerClient } from "@/lib/supabase/server"
import MetricCards from "@/components/dashboard/metric-cards"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import type { Pengaduan } from "@/types"

export default async function YanduanDashboardPage() {
  const supabase = await createServerClient()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .order("created_date", { ascending: false })

  if (error) {
    return <p className="text-red-400">Gagal memuat data: {error.message}</p>
  }

  const list = pengaduan as Pengaduan[]

  const belumDisposisi = list.filter(
    (p) =>
      p.status_label?.includes("Diterima") ||
      p.status_label?.includes("Dikirim ke Polda")
  )

  const diproses = list.filter(
    (p) =>
      !p.status_label?.includes("Diterima") &&
      !p.status_label?.includes("Dikirim ke Polda") &&
      !p.status_label?.includes("Selesai") &&
      !p.status_label?.includes("Terbukti") &&
      !p.status_label?.includes("Tolak")
  )

  const selesai = list.filter(
    (p) =>
      p.status_label?.includes("Selesai") ||
      p.status_label?.includes("Terbukti")
  )

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Yanduan</h2>

      <MetricCards
        cards={[
          { label: "Total Pengaduan", value: list.length },
          {
            label: "Belum Disposisi",
            value: belumDisposisi.length,
            variant: "warning",
          },
          { label: "Diproses", value: diproses.length, variant: "default" },
          { label: "Selesai", value: selesai.length, variant: "success" },
        ]}
      />

      <PengaduanTable data={list} showAksi={true} aksiLabel="Proses" />
    </div>
  )
}
