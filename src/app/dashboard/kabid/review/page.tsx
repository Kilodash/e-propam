import { createServiceClient } from "@/lib/supabase/server"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import { groupUnitsByNormalizedName } from "@/lib/unit-search"
import type { Pengaduan } from "@/types"

export default async function KabidReviewPage() {
  const supabase = createServiceClient()

  const { data: all, error } = await supabase
    .from("pengaduan")
    .select("*")
    .not("saran_kabid", "is", null)
    .is("kabid_approval_status", null)
    .order("disposisi_submitted_at", { ascending: false })

  if (error) {
    return <p className="text-red-400 p-6">Gagal memuat data: {error.message}</p>
  }

  const list = (all as Pengaduan[]) ?? []

  const { data: unitsData } = await supabase
    .from("unit_mapping")
    .select("gajamada_name, normalized_name, satker_level")
    .eq("is_active", true)

  const unitOptions = groupUnitsByNormalizedName((unitsData ?? []) as any[])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-2xl font-bold text-white">Review Disposisi</h2>
        <p className="text-gray-400 text-sm mt-1">
          {list.length} disposisi menunggu persetujuan Kabid
        </p>
      </div>
      {list.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Tidak ada disposisi yang perlu direview.</p>
        </div>
      ) : (
        <PengaduanTable
          data={list}
          showAksi={true}
          aksiLabel="Review"
          aksiHref="/dashboard/kabid/review"
          filterOptions={{
            statuses: Array.from(new Set(list.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
            units: unitOptions,
          }}
        />
      )}
    </div>
  )
}
