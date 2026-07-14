import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import MetricCards from "@/components/dashboard/metric-cards"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import type { Pengaduan } from "@/types"

export default async function UnitDashboardPage() {
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? "paminal"

  const functionMap: Record<string, string> = {
    paminal: "PAMINAL", provos: "PROVOS",
    wabprof: "WABPROF", rehabpers: "REHABPERS",
    polres: "POLRES",
  }
  const policeFn = functionMap[role] ?? role.toUpperCase()

  const supabase = createServiceClient()
  const result = await supabase
    .from("pengaduan")
    .select("*")
    .eq("disposisi_police_function", policeFn)
    .order("created_date", { ascending: false })

  if (result.error) {
    return <p className="text-red-400 p-6">Gagal memuat data: {result.error.message}</p>
  }

  const list = (result.data as Pengaduan[]) ?? []

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard Unit — {policeFn}</h2>
      <MetricCards
        cards={[
          { label: "Total", value: list.length },
          { label: "Proses", value: list.filter(p => !p.status_label?.includes("Selesai")).length, variant: "warning" as const },
          { label: "Selesai", value: list.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti")).length, variant: "success" as const },
          { label: "Dilimpahkan", value: 0, variant: "default" as const },
        ]}
      />
      <PengaduanTable data={list} aksiLabel="Proses" />
    </div>
  )
}
