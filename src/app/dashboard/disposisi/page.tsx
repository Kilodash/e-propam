import { createServiceClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import Link from "next/link"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import { extractSearchKey, sortUnits } from "@/lib/unit-search"
import type { Pengaduan } from "@/types"

const YANDUAN_POSITIONS = [
  "KASUBBAG YANDUAN POLDA JAWA BARAT",
  "OPERATOR YANDUAN POLDA JAWA BARAT",
]

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function DisposisiQueuePage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const activeTab = tab === "riwayat" ? "riwayat" : "antrian"
  const c = await cookies()
  const role = c.get("dev-role")?.value ?? "yanduan"

  if (role !== "yanduan" && role !== "admin") {
    return (
      <p className="text-red-400 p-6">
        Halaman ini hanya untuk Yanduan. Anda login sebagai: {role}.
      </p>
    )
  }

  const supabase = createServiceClient()

  const { data: all, error } = await supabase
    .from("pengaduan")
    .select("*")
    .in("case_position", YANDUAN_POSITIONS)
    .order("created_date", { ascending: false })

  if (error) {
    return <p className="text-red-400 p-6">Gagal memuat data: {error.message}</p>
  }

  const list = (all as Pengaduan[]) ?? []
  const antrian = list.filter((p) => !p.saran_kabid)
  const riwayat = list.filter((p) => p.saran_kabid)
  const display = activeTab === "riwayat" ? riwayat : antrian

  const { data: unitsData } = await supabase
    .from("unit_mapping")
    .select("gajamada_name, normalized_name, satker_level")
    .eq("is_active", true)

  const unitOptions = sortUnits((unitsData ?? []) as any[]).map(u => ({
    value: u.gajamada_name,
    label: u.normalized_name,
    searchKey: extractSearchKey(u.gajamada_name),
  }))
  const dedupedUnits = Array.from(new Map(unitOptions.map(u => [u.value, u])).values())

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/yanduan" className="text-white text-sm hover:text-blue-400">
            ← Kembali ke menu utama
          </Link>
          <h2 className="text-xl font-bold text-white">Disposisi</h2>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/dashboard/disposisi?tab=antrian"
            className={activeTab === "antrian" ? "text-white font-semibold" : "text-gray-400 hover:text-blue-400"}
          >
            Antrian ({antrian.length})
          </Link>
          <Link
            href="/dashboard/disposisi?tab=riwayat"
            className={activeTab === "riwayat" ? "text-white font-semibold" : "text-gray-400 hover:text-blue-400"}
          >
            Riwayat ({riwayat.length})
          </Link>
        </div>
      </div>

      {display.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">
            {activeTab === "riwayat" ? "Belum ada disposisi selesai." : "Semua dumas sudah didisposisikan."}
          </p>
        </div>
      ) : (
        <PengaduanTable
          data={display}
          showAksi={true}
          aksiLabel="Disposisi"
          aksiHref="/dashboard/disposisi"
          filterOptions={{
            statuses: Array.from(new Set(display.map((p) => p.status_label).filter((s): s is string => Boolean(s)))),
            units: dedupedUnits,
          }}
        />
      )}
    </div>
  )
}
