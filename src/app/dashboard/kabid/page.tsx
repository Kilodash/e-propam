import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
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
    .order("updated_at", { ascending: false })

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
      <PengaduanTable
        data={list}
        showAksi
        aksiLabel="Review"
        aksiHref="/dashboard/kabid/pengaduan"
        title="Dashboard Kabid Propam"
        filterOptions={{
          statuses: Array.from(new Set(list.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}
