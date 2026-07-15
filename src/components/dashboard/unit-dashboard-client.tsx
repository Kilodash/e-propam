"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
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

const PREFIX_ORDER: Record<string, number> = {
  KASUBBID: 1, KASUBBAG: 1, KABID: 0, KAUR: 2, UR: 3, UNIT: 4, KANIT: 5, OPERATOR: 6,
}

function sortUnits(units: UnitFilterOption[]) {
  return [...units].sort((a, b) => {
    const pa = a.label?.split(" ")[0] || "Z"
    const pb = b.label?.split(" ")[0] || "Z"
    return (PREFIX_ORDER[pa] ?? 99) - (PREFIX_ORDER[pb] ?? 99) || a.label.localeCompare(b.label)
  })
}

export default function UnitDashboardClient({ data, unitOptions, title, role }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = selected.length > 0
    ? data.filter(p => selected.includes(p.case_position ?? ""))
    : data

  const proses = data.filter(p => !p.status_label?.includes("Selesai")).length
  const selesai = data.filter(p => p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti")).length

  function toggle(v: string) {
    setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const sorted = sortUnits(unitOptions)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="bg-[#0F172A] border border-gray-700 rounded p-2 text-center">
            <div className="text-lg font-bold text-white">{filtered.length}</div>
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

        <div className="mb-2">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
          >
            Filter Unit ({selected.length > 0 ? selected.length : "semua"})
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {open && (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 bg-[#0F172A] border border-gray-700 rounded p-2">
              {sorted.map(opt => (
                <label key={opt.value} className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="w-3 h-3 rounded border-gray-500 bg-gray-700 text-[#0369A1] cursor-pointer"
                  />
                  {opt.label}
                </label>
              ))}
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-xs text-[#0369A1] hover:underline ml-2">
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <PengaduanTable
        data={filtered}
        showAksi={true}
        aksiLabel="Proses"
        aksiHref="/dashboard/unit/pengaduan"
        title={title}
        filterOptions={{
          statuses: Array.from(new Set(filtered.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}
