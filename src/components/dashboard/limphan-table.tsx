import type { Pengaduan } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CheckCircle2, XCircle } from "lucide-react"

interface LimphanTableProps {
  data: Pengaduan[]
}

export default function LimphanTable({ data }: LimphanTableProps) {
  return (
    <div className="bg-[#0F172A] rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 text-left">
            <th className="text-gray-300 font-medium p-3">No. Laporan</th>
            <th className="text-gray-300 font-medium p-3">Pengirim</th>
            <th className="text-gray-300 font-medium p-3">Tanggal Limpah</th>
            <th className="text-gray-300 font-medium p-3">Status Limpah</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-gray-400 py-6">
                Belum ada limpahan
              </td>
            </tr>
          ) : (
            data.map((p) => (
              <tr key={p.id} className="border-b border-gray-700 last:border-0">
                <td className="p-3 font-mono text-gray-200">{p.id}</td>
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
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
