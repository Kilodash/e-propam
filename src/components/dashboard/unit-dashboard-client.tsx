"use client"

import PengaduanTable from "@/components/dashboard/pengaduan-table"
import AksiBuatLaporan from "@/components/pengaduan/aksi-buat-laporan"
import type { Pengaduan } from "@/types"

interface UnitFilterOption {
  value: string
  label: string
  casePositions: string[]
}

interface Props {
  data: Pengaduan[]
  unitOptions: UnitFilterOption[]
  title: string
  role: string
}

export default function UnitDashboardClient({ data, unitOptions, title, role }: Props) {
  const proses = data.filter(p => !p.status_label?.includes("Selesai")).length
  const selesai = data.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti")).length

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="bg-[#0F172A] border border-gray-700 rounded p-2 text-center">
            <div className="text-lg font-bold text-white">{data.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-[#0F172A] border border-gray-700 rounded p-2 text-center">
            <div className="text-lg font-bold text-yellow-400">{proses}</div>
            <div className="text-xs text-gray-500">Proses</div>
          </div>
          <div className="bg-[#0F172A] border border-gray-700 rounded p-2 text-center">
            <div className="text-lg font-bold text-green-400">{selesai}</div>
            <div className="text-xs text-gray-500">Selesai</div>
          </div>
          <div className="bg-[#0F172A] border border-gray-700 rounded p-2 text-center">
            <div className="text-lg font-bold text-gray-400">0</div>
            <div className="text-xs text-gray-500">Dilimpahkan</div>
          </div>
        </div>

        {["paminal", "provos", "wabprof"].includes(role) && (
          <div className="mb-2">
            <AksiBuatLaporan role={role} />
          </div>
        )}
      </div>

      <PengaduanTable
        data={data}
        showAksi={true}
        aksiLabel="Proses"
        aksiHref="/dashboard/unit/pengaduan"
        title={title}
        hideUnitFilter
        filterOptions={{
          statuses: Array.from(new Set(data.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}
