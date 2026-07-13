"use client"

import { useState } from "react"
import type { Pengaduan } from "@/types"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight } from "lucide-react"

interface SatkerRow {
  name: string
  function: string
  total: number
  proses: number
  lambat: number
  selesai: number
  pengaduan: Pengaduan[]
}

const LAMBAT_DAYS = 30

function groupByFunction(data: Pengaduan[]): SatkerRow[] {
  const functions = ["PAMINAL", "PROVOS", "WABPROF", "REHABPERS"]
  return functions.map((fn) => {
    const items = data.filter((p) => p.disposisi_police_function === fn)
    const selesai = items.filter((p) =>
      p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti") || p.status_label?.includes("Rekomendasi")
    )
    const lambat = items.filter((p) => {
      if (!p.created_date) return false
      if (p.status_label?.includes("Selesai")) return false
      return Date.now() - new Date(p.created_date).getTime() > LAMBAT_DAYS * 86400000
    })
    return {
      name: fn,
      function: fn,
      total: items.length,
      proses: items.length - selesai.length,
      lambat: lambat.length,
      selesai: selesai.length,
      pengaduan: items,
    }
  })
}

export default function KinerjaTable({ data }: { data: Pengaduan[] }) {
  const rows = groupByFunction(data)
  const [expanded, setExpanded] = useState<string | null>(null)

  const polresData = data.filter((p) =>
    p.disposisi_police_function && !["PAMINAL", "PROVOS", "WABPROF", "REHABPERS", "YANDUAN"].includes(p.disposisi_police_function)
  )
  if (polresData.length > 0) {
    rows.push({
      name: "Polres/Satbrimob",
      function: "POLRES",
      total: polresData.length,
      proses: polresData.filter((p) => !p.status_label?.includes("Selesai")).length,
      lambat: 0,
      selesai: polresData.filter((p) => p.status_label?.includes("Selesai")).length,
      pengaduan: polresData,
    })
  }

  return (
    <div className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700 hover:bg-transparent">
            <TableHead className="text-gray-300 w-[40px]"></TableHead>
            <TableHead className="text-gray-300">Satker</TableHead>
            <TableHead className="text-gray-300 text-center">Total</TableHead>
            <TableHead className="text-gray-300 text-center">Proses</TableHead>
            <TableHead className="text-gray-300 text-center">Lambat</TableHead>
            <TableHead className="text-gray-300 text-center">Selesai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <>
              <TableRow
                key={row.function}
                className="border-gray-700 cursor-pointer hover:bg-[#1e293b]"
                onClick={() => setExpanded(expanded === row.function ? null : row.function)}
              >
                <TableCell>
                  {expanded === row.function
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                </TableCell>
                <TableCell className="text-white font-medium">{row.name}</TableCell>
                <TableCell className="text-center text-gray-300">{row.total}</TableCell>
                <TableCell className="text-center text-yellow-400">{row.proses}</TableCell>
                <TableCell className="text-center text-red-400 font-bold">{row.lambat}</TableCell>
                <TableCell className="text-center text-green-400">{row.selesai}</TableCell>
              </TableRow>
              {expanded === row.function && (
                <TableRow className="border-gray-700 bg-[#1a2332]">
                  <TableCell colSpan={6} className="p-0">
                    <div className="p-3">
                      <p className="text-gray-400 text-sm mb-2">
                        {row.pengaduan.length} pengaduan
                      </p>
                      {row.pengaduan.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex justify-between text-sm py-1 border-b border-gray-700 last:border-0">
                          <span className="text-gray-300 font-mono">{p.id}</span>
                          <span className="text-gray-400">{p.pengirim ?? "-"}</span>
                          <span className={
                            p.status_label?.includes("Selesai") ? "text-green-400" :
                            p.status_label?.includes("Tolak") ? "text-red-400" : "text-yellow-400"
                          }>{p.status_label ?? "-"}</span>
                        </div>
                      ))}
                      {row.pengaduan.length > 5 && (
                        <p className="text-gray-500 text-xs mt-2">
                          + {row.pengaduan.length - 5} lainnya
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
