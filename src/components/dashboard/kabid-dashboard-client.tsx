"use client"

import { useState } from "react"
import PengaduanTable from "@/components/dashboard/pengaduan-table"
import type { Pengaduan } from "@/types"

interface UnitFilterOption {
  value: string
  label: string
  casePositions?: string[]
}

interface Props {
  data: Pengaduan[]
  pending: Pengaduan[]
  unitOptions: UnitFilterOption[]
  title: string
}

export default function KabidDashboardClient({ data, pending, unitOptions, title }: Props) {
  const [tab, setTab] = useState<"menunggu" | "sudah">("menunggu")
  const tabData = tab === "menunggu" ? pending : data.filter(p => !pending.includes(p))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="flex gap-0 border-b border-gray-700 mb-2">
          <button
            onClick={() => setTab("menunggu")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === "menunggu"
                ? "text-white border-blue-400 bg-blue-900/20"
                : "text-gray-400 border-transparent hover:text-gray-200"
            }`}
          >
            Menunggu Disposisi ({pending.length})
          </button>
          <button
            onClick={() => setTab("sudah")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === "sudah"
                ? "text-white border-blue-400 bg-blue-900/20"
                : "text-gray-400 border-transparent hover:text-gray-200"
            }`}
          >
            Sudah Didisposisi ({data.length - pending.length})
          </button>
        </div>
      </div>
      <PengaduanTable
        data={tabData}
        showAksi={tab === "menunggu"}
        aksiLabel="Review"
        aksiHref="/dashboard/kabid/pengaduan"
        title={title}
        filterOptions={{
          statuses: Array.from(new Set(tabData.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}
