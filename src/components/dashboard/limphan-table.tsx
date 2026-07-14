"use client"

import { useMemo } from "react"
import type { Pengaduan } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

interface LimphanTableProps {
  data: Pengaduan[]
}

export default function LimphanTable({ data }: LimphanTableProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Pengaduan[]>()
    const others: Pengaduan[] = []
    for (const p of data) {
      const unit = p.disposisi_polres ?? p.case_position ?? "Wassidik"
      if (!map.has(unit)) map.set(unit, [])
      map.get(unit)!.push(p)
    }
    return Array.from(map.entries())
  }, [data])

  return (
    <div className="space-y-4">
      {grouped.length === 0 && (
        <div className="bg-[#0F172A] rounded-lg border border-gray-700 p-6 text-center text-gray-400">
          Belum ada limpahan
        </div>
      )}
      {grouped.map(([unit, items]) => (
        <div key={unit} className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center">
            <span className="text-white font-medium text-sm">{unit}</span>
            <span className="text-gray-400 text-xs">{items.length} pengaduan</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-left">
                <th className="text-gray-300 font-medium p-3">No. Laporan</th>
                <th className="text-gray-300 font-medium p-3">Pengirim</th>
                <th className="text-gray-300 font-medium p-3">Tanggal Limpah</th>
                <th className="text-gray-300 font-medium p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-700 last:border-0">
                  <td className="p-3 font-mono text-gray-200">
                    <Link href={`/dashboard/pengaduan/${p.id}`} className="hover:text-[#0369A1]">{p.id}</Link>
                  </td>
                  <td className="p-3 text-gray-300">{p.pengirim ?? "-"}</td>
                  <td className="p-3 text-gray-400">
                    {p.updated_at ? format(new Date(p.updated_at), "dd MMM yyyy", { locale: id }) : "-"}
                  </td>
                  <td className="p-3">
                    {p.status_label?.includes("Wassidik") || p.status_label?.includes("Limpah") ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-4 h-4" /> Sudah
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <XCircle className="w-4 h-4" /> Belum
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
