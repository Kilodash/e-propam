"use client"

import React, { useState, useMemo } from "react"
import type { Pengaduan } from "@/types"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"

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

function computeRow(label: string, fn: string, items: Pengaduan[]): SatkerRow {
  const selesai = items.filter((p) =>
    p.status_label?.includes("Selesai") || p.status_label?.includes("Terbukti") || p.status_label?.includes("Rekomendasi")
  )
  const lambat = items.filter((p) => {
    if (!p.created_date) return false
    if (p.status_label?.includes("Selesai")) return false
    return Date.now() - new Date(p.created_date).getTime() > LAMBAT_DAYS * 86400000
  })
  return {
    name: label,
    function: fn,
    total: items.length,
    proses: items.length - selesai.length,
    lambat: lambat.length,
    selesai: selesai.length,
    pengaduan: items,
  }
}

function groupData(data: Pengaduan[]): SatkerRow[] {
  const rows: SatkerRow[] = []

  // Subbid rows
  for (const fn of ["PAMINAL", "PROVOS", "WABPROF", "REHABPERS"]) {
    const items = data.filter((p) => p.disposisi_police_function === fn)
    if (items.length > 0) rows.push(computeRow(fn, fn, items))
  }

  // Polres / Satbrimob — individual rows
  const polresItems = data.filter((p) =>
    p.disposisi_police_function && !["PAMINAL", "PROVOS", "WABPROF", "REHABPERS", "YANDUAN"].includes(p.disposisi_police_function)
  )
  const byPolres = new Map<string, Pengaduan[]>()
  for (const p of polresItems) {
    const key = p.disposisi_polres ?? p.disposisi_police_function ?? "Lainnya"
    if (!byPolres.has(key)) byPolres.set(key, [])
    byPolres.get(key)!.push(p)
  }
  for (const [name, items] of byPolres) {
    rows.push(computeRow(name, `POLRES-${name}`, items))
  }

  // Wassidik rows
  const wassidikItems = data.filter((p) =>
    p.disposisi_police_function === "WASSIDIK" || p.status_label?.includes("Wassidik") || p.status_label?.includes("Limpah")
  )
  if (wassidikItems.length > 0) {
    const byWassidik = new Map<string, Pengaduan[]>()
    for (const p of wassidikItems) {
      const key = p.disposisi_polres ?? "Wassidik"
      if (!byWassidik.has(key)) byWassidik.set(key, [])
      byWassidik.get(key)!.push(p)
    }
    for (const [name, items] of byWassidik) {
      rows.push(computeRow(`Wassidik ${name}`, `WASSIDIK-${name}`, items))
    }
  }

  return rows
}

export default function KinerjaTable({ data }: { data: Pengaduan[] }) {
  const rows = useMemo(() => groupData(data), [data])
  const [expanded, setExpanded] = useState<string | null>(null)

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
            <React.Fragment key={row.function}>
              <TableRow
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
                          <Link href={`/dashboard/pengaduan/${p.id}`} className="text-gray-300 font-mono hover:text-[#0369A1]">{p.id}</Link>
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
            </React.Fragment>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-400 py-6">
                Belum ada data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
