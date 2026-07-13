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
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { id } from "date-fns/locale"

const PAGE_SIZE = 10

interface PengaduanTableProps {
  data: Pengaduan[]
  showAksi?: boolean
  aksiLabel?: string
  filterOptions?: {
    categories: string[]
    statuses: string[]
  }
}

export default function PengaduanTable({
  data,
  showAksi = true,
  aksiLabel = "Proses",
  filterOptions,
}: PengaduanTableProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return data.filter((p) => {
      const matchSearch =
        !search ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        (p.pengirim ?? "").toLowerCase().includes(search.toLowerCase())
      const matchCategory =
        categoryFilter === "all" || p.category === categoryFilter
      const matchStatus =
        statusFilter === "all" || p.status_label === statusFilter
      return matchSearch && matchCategory && matchStatus
    })
  }, [data, search, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const categories = filterOptions?.categories ?? [
    ...new Set(data.map((p) => p.category).filter(Boolean)),
  ]
  const statuses = filterOptions?.statuses ?? [
    ...new Set(data.map((p) => p.status_label).filter(Boolean)),
  ]

  const formatDate = (d: string | null) => {
    if (!d) return "-"
    return format(new Date(d), "dd MMM yyyy, HH:mm", { locale: id })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari no. laporan atau pengirim..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 bg-[#0F172A] border-gray-600 text-white"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px] bg-[#0F172A] border-gray-600 text-white">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c!} value={c!}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[200px] bg-[#0F172A] border-gray-600 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s!} value={s!}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-transparent">
              <TableHead className="text-gray-300 w-[120px]">
                No. Laporan
              </TableHead>
              <TableHead className="text-gray-300">Pengirim</TableHead>
              <TableHead className="text-gray-300">Kategori</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Tanggal</TableHead>
              {showAksi && (
                <TableHead className="text-gray-300 w-[80px]">Aksi</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showAksi ? 6 : 5}
                  className="text-center text-gray-400 py-8"
                >
                  Belum ada pengaduan
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((p) => (
                <TableRow key={p.id} className="border-gray-700">
                  <TableCell className="font-mono text-sm text-gray-200">
                    {p.id}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {p.pengirim ?? "-"}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {p.category ?? "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        p.status_label?.includes("Selesai") ||
                        p.status_label?.includes("Terbukti") ||
                        p.status_label?.includes("selesai") ||
                        p.status_label?.includes("terbukti")
                          ? "bg-green-900 text-green-300"
                          : p.status_label?.includes("Tolak") ||
                            p.status_label?.includes("tolak")
                          ? "bg-red-900 text-red-300"
                          : "bg-yellow-900 text-yellow-300"
                      }`}
                    >
                      {p.status_label ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {formatDate(p.created_date)}
                  </TableCell>
                  {showAksi && (
                    <TableCell>
                      <Link href={`/dashboard/pengaduan/${p.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#0369A1] text-[#0369A1] text-xs"
                        >
                          {aksiLabel}
                        </Button>
                      </Link>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-gray-400">
          <span className="text-sm">
            Menampilkan {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="border-gray-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
