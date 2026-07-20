import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import { groupUnitsByNormalizedName } from "@/lib/unit-search"
import { getYanduanData } from "@/lib/dashboard-cache"
import type { Pengaduan } from "@/types"

export default async function YanduanDashboardPage() {
  const user = await getCurrentUser()
  if (!user || (user.role !== "yanduan" && user.role !== "admin")) redirect("/login")

  const { pengaduan, units } = await getYanduanData()

  const list = pengaduan as Pengaduan[]
  const unitOptions = groupUnitsByNormalizedName(
    (units ?? []) as { gajamada_name: string; normalized_name: string; satker_level: string }[]
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
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
