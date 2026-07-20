"use client"

import { useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const initStatus = searchParams.get("status") ?? ""
  const initUnit = searchParams.get("unit") ?? ""
  const initSearch = searchParams.get("q") ?? ""

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PengaduanTable
        data={data}
        showAksi={true}
        aksiLabel="Proses"
        aksiHref="/dashboard/unit/pengaduan"
        title={title}
        hideUnitFilter={!isLeadership}
        headerLeft={["paminal", "provos", "wabprof"].includes(role) ? <AksiBuatLaporan role={role} /> : undefined}
        initStatus={initStatus}
        initUnit={initUnit}
        initSearch={initSearch}
        filterOptions={{
          statuses: Array.from(new Set(data.map(p => p.status_label).filter((s): s is string => Boolean(s)))),
          units: unitOptions,
        }}
      />
    </div>
  )
}
