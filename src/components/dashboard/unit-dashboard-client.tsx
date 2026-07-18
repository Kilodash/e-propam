"use client"

import { useState } from "react"
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
  isLeadership?: boolean
}

export default function UnitDashboardClient({ data, unitOptions, title, role, isLeadership }: Props) {
  const [tab, setTab] = useState<"aktif" | "dilimpahkan">("aktif")

  const ownPositions = unitOptions.flatMap(u => u.casePositions?.length ? u.casePositions : [u.value])

  const isMine = (p: Pengaduan) =>
    !!p.case_position && ownPositions.some(pos => p.case_position === pos || p.case_position.includes(pos))
  const wasMine = (p: Pengaduan) =>
    !!p.previous_case_position &&
    ownPositions.some(pos => p.previous_case_position === pos || p.previous_case_position.includes(pos))

  const aktif = data.filter(p => isMine(p) || (!wasMine(p) && !p.previous_case_position))
  const dilimpahkan = data.filter(p => wasMine(p) && !isMine(p))

  const proses = aktif.filter(p => !p.status_label?.includes("Selesai")).length
  const selesai = data.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti")).length

  const tabData = tab === "aktif" ? aktif : dilimpahkan

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
            <div className="text-xs text-gray-500">Aktif Proses</div>
          </div>
          <div className="bg-[#0F172A] border border-gray-700 rounded p-2 text-center">
            <div className="text-lg font-bold text-green-400">{selesai}</div>
            <div className="text-xs text-gray-500">Selesai</div>
          </div>
          <div className="bg-[#0F172A] border border-gray-700 rounded p-2 text-center">
            <div className="text-lg font-bold text-gray-400">{dilimpahkan.length}</div>
            <div className="text-xs text-gray-500">Dilimpahkan</div>
          </div>
        </div>
        <div className="flex gap-0 border-b border-gray-700 mb-2">
          <button
            onClick={() => setTab("aktif")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === "aktif"
                ? "text-white border-blue-400 bg-blue-900/20"
                : "text-gray-400 border-transparent hover:text-gray-200"
            }`}
          >
            Aktif ({aktif.length})
          </button>
          <button
            onClick={() => setTab("dilimpahkan")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === "dilimpahkan"
                ? "text-white border-blue-400 bg-blue-900/20"
                : "text-gray-400 border-transparent hover:text-gray-200"
            }`}
          >
            Sudah Dilimpahkan ({dilimpahkan.length})
          </button>
        </div>
      </div>

      <PengaduanTable
        data={tabData}
        showAksi={tab === "aktif"}
        aksiLabel="Proses"
        aksiHref="/dashboard/unit/pengaduan"
        title={title}
        hideUnitFilter={!isLeadership}
        headerLeft={["paminal", "provos", "wabprof"].includes(role) ? <AksiBuatLaporan role={role} /> : undefined}
        filterOptions={{
          statuses: Array.from(new Set(tabData.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}

