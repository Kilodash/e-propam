import { createServerClient } from "@/lib/supabase/server"
import MetricCards from "@/components/dashboard/metric-cards"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import type { Pengaduan } from "@/types"

export default async function UnitDashboardPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single()

  const role = profile?.role ?? "paminal"
  const functionMap: Record<string, string> = {
    paminal: "PAMINAL",
    provos: "PROVOS",
    wabprof: "WABPROF",
    rehabpers: "REHABPERS",
  }

  const policeFn = functionMap[role] ?? role.toUpperCase()

  const { data: pengaduan, error } = await supabase
    .from("pengaduan")
    .select("*")
    .eq("disposisi_police_function", policeFn)
    .order("created_date", { ascending: false })

  if (error) {
    return <p className="text-red-400">Gagal memuat data: {error.message}</p>
  }

  const list = pengaduan as Pengaduan[]

  const proses = list.filter(
    (p) =>
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
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Unit</h2>

      <MetricCards
        cards={[
          { label: "Total", value: list.length },
          { label: "Proses", value: proses.length, variant: "warning" },
          { label: "Selesai", value: selesai.length, variant: "success" },
          { label: "Dilimpahkan", value: 0, variant: "default" },
        ]}
      />

      <PengaduanTable data={list} aksiLabel="Proses" />
    </div>
  )
}
