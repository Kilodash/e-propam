import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import MetricCards from "@/components/dashboard/metric-cards"
import KabidDashboardClient from "@/components/dashboard/kabid-dashboard-client"
import { groupUnitsByNormalizedName } from "@/lib/unit-search"
import type { Pengaduan } from "@/types"

export default async function KabidDashboardPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== "kabid" && user.role !== "admin")) redirect("/login")

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

  const pending = list.filter(p => p.saran_kabid && !p.kabid_approval_status)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <MetricCards
          cards={[
            { label: "Total Pengaduan", value: list.length },
            { label: "Menunggu Review", value: pending.length, variant: "warning" as const },
            { label: "Disetujui", value: list.filter(p => p.kabid_approval_status === "approved").length, variant: "success" as const },
            { label: "Ditolak", value: list.filter(p => p.kabid_approval_status === "rejected").length, variant: "danger" as const },
          ]}
        />
      </div>
      <KabidDashboardClient
        data={list}
        pending={pending}
        unitOptions={unitOptions}
        title="Dashboard Kabid Propam"
      />
    </div>
  )
}
