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

const PAGE_SIZE = 25

interface PengaduanTableProps {
  data: Pengaduan[]
  showAksi?: boolean
  aksiLabel?: string
  filterOptions?: {
    categories: string[]
    statuses: string[]
    units: string[]
  }
  onRefresh?: () => void
}

export default function PengaduanTable({
  data,
  showAksi = false,
  aksiLabel = "Proses",
  filterOptions,
  onRefresh,
}: PengaduanTableProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [unitFilter, setUnitFilter] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchSearch =
        !search ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        (p.pengirim ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.summary ?? "").toLowerCase().includes(search.toLowerCase())
      const matchCategory = !categoryFilter || p.category === categoryFilter
      const matchStatus = !statusFilter || p.status_label === statusFilter
      const matchUnit = !unitFilter || p.disposisi_polres === unitFilter
      return matchSearch && matchCategory && matchStatus && matchUnit
    })
  }, [data, search, categoryFilter, statusFilter, unitFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const startIdx = (page - 1) * PAGE_SIZE
  const pageData = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  const categories = filterOptions?.categories ?? [
    ...new Set(data.map((p) => p.category).filter(Boolean)),
  ]
  const statuses = filterOptions?.statuses ?? [
    ...new Set(data.map((p) => p.status_label).filter(Boolean)),
  ]
  const units = filterOptions?.units ?? [
    ...new Set(data.map((p) => p.disposisi_polres).filter(Boolean)),
  ]

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
    const s = status.toLowerCase()
    if (s.includes("selesai") || s.includes("terbukti")) return "bg-green-100 text-green-800"
    if (s.includes("tolak")) return "bg-red-100 text-red-800"
    if (s.includes("verifikasi") || s.includes("review")) return "bg-blue-100 text-blue-800"
    return "bg-yellow-100 text-yellow-800"
  }

  return (
    <div className="space-y-3 bg-[#0F172A] -mx-6 px-6 py-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ""); setPage(1) }}>
          <SelectTrigger className="w-[200px] bg-[#0F172A] text-white border-gray-600 h-10 text-sm">
            <SelectValue placeholder="STATUS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">STATUS</SelectItem>
            {statuses.map((s) => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={unitFilter} onValueChange={(v) => { setUnitFilter(v ?? ""); setPage(1) }}>
          <SelectTrigger className="w-[200px] bg-[#0F172A] text-white border-gray-600 h-10 text-sm">
            <SelectValue placeholder="SATKER" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">SATKER</SelectItem>
            {units.map((u) => <SelectItem key={u!} value={u!}>{u}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? ""); setPage(1) }}>
          <SelectTrigger className="w-[200px] bg-[#0F172A] text-white border-gray-600 h-10 text-sm">
            <SelectValue placeholder="KATEGORI" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">KATEGORI</SelectItem>
            {categories.map((c) => <SelectItem key={c!} value={c!}>{c}</SelectItem>)}
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

        <Button size="sm" onClick={() => setPage(1)} className="bg-[#0369A1] hover:bg-[#0284c7] text-white h-10 text-sm px-3">
          <Search className="w-4 h-4 mr-1" /> Cari
        </Button>

        <Button size="sm" variant="outline" onClick={resetFilters} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-10 text-sm px-3">
          Reset
        </Button>

        {onRefresh && (
          <Button size="sm" variant="outline" onClick={onRefresh} className="text-white border-gray-600 bg-[#0F172A] hover:bg-[#1e293b] h-10 text-sm px-3">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table className="table-fixed w-full">
          <colgroup>
            <col style={{ width: "32px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "180px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "240px" }} />
            <col style={{ width: "80px" }} />
            <col style={{ width: "150px" }} />
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8 text-[12px]">
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
                      {p.status_label ?? "-"}
                    </span>
                    {p.case_position && (
                      <div className="text-[12px] text-gray-500 mt-1 whitespace-normal break-words leading-tight">
                        {p.case_position}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-[12px] text-white">
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
