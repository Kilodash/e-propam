"use client"

import { useState, useMemo } from "react"
import type { Pengaduan } from "@/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { categorizeStatus, type StatusCategory } from "@/lib/status-category"

const PAGE_SIZE = 10

interface PengaduanTableProps {
  data: Pengaduan[]
  showAksi?: boolean
  aksiLabel?: string
  aksiHref?: string
  filterOptions?: {
    categories?: string[]
    statuses?: string[]
    units?: { value: string; label: string; casePositions?: string[] }[] | string[]
  }
  onRefresh?: () => void
  title?: string
  hideEmptyUnits?: boolean
}

export default function PengaduanTable({
  data,
  showAksi = false,
  aksiLabel = "Proses",
  aksiHref,
  filterOptions,
  onRefresh,
  title,
  hideEmptyUnits = false,
}: PengaduanTableProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [unitFilter, setUnitFilter] = useState("")
  const [page, setPage] = useState(1)

  const categories = filterOptions?.categories ?? [
    ...new Set(data.map((p) => p.category).filter(Boolean)),
  ]
  const statuses = filterOptions?.statuses ?? [
    ...new Set(data.map((p) => p.status_label).filter(Boolean)),
  ]
  const rawUnits = (filterOptions?.units ?? []) as (string | { value: string; label: string; casePositions?: string[] })[]
  const normalizedUnits = rawUnits.length > 0
    ? rawUnits.map((u: any) => typeof u === "string" ? { value: u, label: u, casePositions: undefined } : u)
    : [...new Map(
        data
          .map((p) => p.disposisi_polres)
          .filter((u): u is string => Boolean(u))
          .map((u) => [u, u])
      ).values()
    ].map((u: any) => ({ value: u, label: u, casePositions: undefined as string[] | undefined }))

  const units = Array.from(
    new Map(normalizedUnits.map((u: any) => [u.value, u])).values()
  ) as { value: string; label: string; casePositions?: string[] }[]

  const unitCounts = useMemo(() => {
    return new Map(units.map(u => {
      const count = u.casePositions && u.casePositions.length > 0
        ? data.filter(p => u.casePositions!.includes(p.case_position ?? "")).length
        : data.filter(p => p.case_position === u.value).length
      return [u.value, count]
    }))
  }, [data, units])

  const statusCounts = useMemo(() => {
    let countData = data
    if (unitFilter) {
      const selectedUnit = units.find(u => u.value === unitFilter)
      if (selectedUnit) {
        if (selectedUnit.casePositions && selectedUnit.casePositions.length > 0) {
          countData = countData.filter(p => selectedUnit.casePositions!.includes(p.case_position ?? ""))
        } else {
          countData = countData.filter(p => p.case_position === selectedUnit.value)
        }
      }
    }
    return new Map(statuses.map(s => {
      const count = countData.filter(p => p.status_label === s).length
      return [s, count]
    }))
  }, [data, statuses, unitFilter, units])

  const filtered = useMemo(() => {
    return data.filter((p) => {
      if (!p.id || !(p.status_label || p.category || p.summary || p.content || p.prepetrator_name || p.pengirim)) return false
      const matchSearch =
        !search ||
        (() => {
          const q = search.toLowerCase()
          const fields: (string | null | undefined)[] = [
            p.id, p.prepetrator_id,
            p.pengirim, p.phone_no, p.email, p.reporter_nik, p.pengirim_address,
            p.terlapor_name, p.prepetrator_name, p.terlapor_rank, p.terlapor_position, p.terlapor_nrp, p.terlapor_division,
            p.summary, p.content, p.alamat_kejadian,
            p.status_label, p.case_position, p.saran_kabid, p.disposisi_satker_tujuan, p.unit_progress,
            p.kembalikan_alasan, p.override_alasan, p.category, p.sub_category, p.source, p.source_alias,
          ]
          return fields.some(f => f && f.toLowerCase().includes(q))
        })()
      const matchCategory = !categoryFilter || p.category === categoryFilter
      const matchStatus = !statusFilter || p.status_label === statusFilter
      const matchUnit = !unitFilter || (() => {
        const selectedUnit = units.find(u => u.value === unitFilter)
        if (!selectedUnit) return false
        if (selectedUnit.casePositions && selectedUnit.casePositions.length > 0) {
          return selectedUnit.casePositions.includes(p.case_position ?? "")
        }
        return p.case_position === selectedUnit.value
      })()
      return matchSearch && matchCategory && matchStatus && matchUnit
    })
  }, [data, search, categoryFilter, statusFilter, unitFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const startIdx = (page - 1) * PAGE_SIZE
  const pageData = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  const resetFilters = () => {
    setSearch("")
    setCategoryFilter("")
    setStatusFilter("")
    setUnitFilter("")
    setPage(1)
  }

  const formatDate = (d: string | null) => {
    if (!d) return "-"
    return format(new Date(d), "dd MMM yyyy", { locale: id })
  }

  const getStatusStyle = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-700"
    const { category } = categorizeStatus(status)
    const colors: Record<StatusCategory | string, string> = {
      diterima: "bg-blue-100 text-blue-800",
      dikirim: "bg-yellow-100 text-yellow-800",
      dalam_proses: "bg-purple-100 text-purple-800",
      selesai: "bg-green-100 text-green-800",
      ditolak: "bg-red-100 text-red-800",
      dikembalikan: "bg-orange-100 text-orange-800",
      lainnya: "bg-gray-100 text-gray-700",
    }
    return colors[category] ?? colors.lainnya
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2 bg-[#0F172A] -mx-6 px-6 py-3 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 justify-between flex-shrink-0">
        {title && <span className="text-xs text-gray-500 tracking-wide uppercase">{title}</span>}
        <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
          <SelectTrigger className="w-[200px] bg-[#0F172A] text-white border-gray-600 h-10 text-sm">
            <SelectValue placeholder="STATUS">
              {statusFilter ? statusFilter : "STATUS"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">STATUS</SelectItem>
            {statuses
              .filter((s) => (statusCounts.get(s) ?? 0) > 0)
              .map((s) => {
                const count = statusCounts.get(s) ?? 0
                return <SelectItem key={s!} value={s!}>{s} ({count})</SelectItem>
              })}
          </SelectContent>
        </Select>

        <Select value={unitFilter || "all"} onValueChange={(v) => { setUnitFilter(v === "all" ? "" : v); setPage(1) }}>
          <SelectTrigger className="w-[320px] bg-[#0F172A] text-white border-gray-600 h-10 text-sm">
            <SelectValue placeholder="SATKER">
              {unitFilter ? units.find(u => u.value === unitFilter)?.label : "SATKER"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">SATKER</SelectItem>
            {units
              .filter((u) => !hideEmptyUnits || (unitCounts.get(u.value) ?? 0) > 0)
              .map((u, i) => {
                const count = unitCounts.get(u.value) ?? 0
                return <SelectItem key={i} value={u.value}>{u.label} ({count})</SelectItem>
              })}
          </SelectContent>
        </Select>

        <div className="relative w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 bg-[#0F172A] text-white border-gray-600 h-10 text-sm placeholder:text-gray-400"
          />
        </div>

        <Button size="sm" onClick={() => setPage(1)} className="bg-[#0369A1] hover:bg-[#0284c7] text-white h-10 text-sm px-3" aria-label="Cari pengaduan">
          <Search className="w-4 h-4 mr-1" /> Cari
        </Button>

        <Button size="sm" variant="outline" onClick={resetFilters} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-10 text-sm px-3" aria-label="Reset filter">
          Reset
        </Button>

        {onRefresh && (
          <Button size="sm" variant="outline" onClick={onRefresh} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-10 text-sm px-3" aria-label="Refresh data">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-white rounded-lg border border-gray-200">
        <Table className="table-fixed w-full">
          <colgroup>
            <col style={{ width: "32px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: showAksi ? "220px" : "240px" }} />
            <col style={{ width: "80px" }} />
            <col style={{ width: "150px" }} />
            {showAksi && <col style={{ width: "80px" }} />}
          </colgroup>
          <TableHeader>
            <TableRow className="border-gray-200 hover:bg-transparent">
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">No</TableHead>
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">Info Laporan</TableHead>
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">Terlapor</TableHead>
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">Pelapor</TableHead>
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">Kategori</TableHead>
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">Rangkuman</TableHead>
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">Updated</TableHead>
              <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold">Status</TableHead>
              {showAksi && <TableHead className="text-gray-700 px-2 py-2 text-[12px] font-semibold text-center">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showAksi ? 9 : 8} className="text-center text-gray-500 py-8 text-[12px]">
                  Belum ada pengaduan
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((p, idx) => (
                <TableRow key={p.id} className="border-gray-200 hover:bg-gray-50 align-top">
                  <TableCell className="text-gray-600 text-[12px] px-2 py-2">{startIdx + idx + 1}</TableCell>
                  <TableCell className="px-2 py-2">
                    <Link href={`/dashboard/pengaduan/${p.id}`} className="font-mono text-[12px] font-semibold text-gray-900 hover:text-blue-700 block whitespace-normal break-words">
                      {p.id}
                    </Link>
                    <div className="text-[12px] text-gray-500">{formatDate(p.created_date)}</div>
                    {p.source && (
                      <span className="inline-block mt-1 text-[12px] bg-cyan-100 text-cyan-800 px-1 py-0.5 rounded">
                        {p.source}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <div className="text-[12px] text-gray-900 whitespace-normal break-words">
                      {p.prepetrator_name || <span className="text-gray-400 italic">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <div className="text-[12px] text-gray-900 whitespace-normal break-words">{p.pengirim ?? "-"}</div>
                    {p.phone_no && <div className="text-[12px] text-gray-500">{p.phone_no}</div>}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    {p.category && (
                      <span className="inline-block text-[12px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded uppercase whitespace-normal break-words">
                        {p.category}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-[12px] text-gray-700 px-2 py-2 align-top">
                    <p
                      className="whitespace-normal break-words"
                      style={{ display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {p.summary ?? p.content ?? "-"}
                    </p>
                  </TableCell>
                  <TableCell className="text-[12px] text-gray-600 px-2 py-2">
                    {p.updated_at ? formatDate(p.updated_at) : "-"}
                  </TableCell>
                  <TableCell className="px-2 py-2">
                    <span className={`inline-block text-[12px] px-1.5 py-0.5 rounded ${getStatusStyle(p.status_label)}`}>
                      {p.status_label ? categorizeStatus(p.status_label).label : "-"}
                    </span>
                    {p.case_position && (
                      <div className="text-[12px] text-gray-500 mt-1 whitespace-normal break-words leading-tight">
                        {p.case_position}
                      </div>
                    )}
                  </TableCell>
                  {showAksi && (
                    <TableCell className="px-2 py-2 text-center">
                      <Link
                        href={`${aksiHref ?? "/dashboard/pengaduan"}/${p.id}${unitFilter ? `?unit=${encodeURIComponent(unitFilter)}` : ""}`}
                        className="inline-block text-[12px] bg-[#0369A1] hover:bg-[#0284c7] text-white px-2 py-1 rounded"
                      >
                        {aksiLabel}
                      </Link>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-[12px] text-white flex-shrink-0">
        <span>
          Halaman {page} dari {totalPages} • Total {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-7 px-2 text-[12px]">
            Awal
          </Button>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-7 px-2 text-[12px]">
            <ChevronLeft className="w-3 h-3" /> Sebelumnya
          </Button>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-7 px-2 text-[12px]">
            Selanjutnya <ChevronRight className="w-3 h-3" />
          </Button>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-7 px-2 text-[12px]">
            Akhir
          </Button>
        </div>
      </div>
    </div>
  )
}
