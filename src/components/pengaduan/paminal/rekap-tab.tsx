"use client"

import { useState } from "react"
import { Loader2, Send, Printer, Copy, Check } from "lucide-react"
import { STAGES } from "./paminal-shared"
import type { RekapTabProps } from "./paminal-shared"

interface Props extends RekapTabProps {
  isDone: boolean
  gelarTgl: string
  gelarNo: string
  pengaduanId: string
}

export default function RekapTab({
  stage, hasil, gelarTgl, gelarNo, tlList, pelanggarList, pelimpahan,
  error, success, skipGajamada, onToggleSkip, onSubmit, loading, pengaduan, isDone,
  pengaduanId,
}: Props) {
  const [copied, setCopied] = useState(false)

  const rekapLines = [
    `Tahap: ${STAGES.find(s => s.value === stage)?.label}`,
    gelarTgl ? `Gelar: ${gelarTgl}` : "",
    gelarNo ? `Notulen: ${gelarNo}` : "",
    hasil ? `Hasil: ${hasil === "terbukti" ? "Terbukti" : hasil === "perdamaian" ? "Perdamaian" : "Tidak Terbukti"}` : "",
    pelimpahan ? `Pelimpahan: ${pelimpahan}` : "",
    tlList.filter(t => t.checked).length > 0 ? `Tindak Lanjut: ${tlList.filter(t => t.checked).map(t => `${t.label} — ${t.nomor || "-"}`).join(", ")}` : "",
    pelanggarList.filter(p => p.nama.trim()).length > 0 ? `Pelanggar: ${pelanggarList.filter(p => p.nama.trim()).map(p => `${p.nama} / ${p.pangkat} / NRP: ${p.nrp}`).join("; ")}` : "",
  ].filter(Boolean).join("\n")

  async function salinRekap() {
    await navigator.clipboard.writeText(rekapLines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isDone) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400">Ringkasan Final</p>
        <div className="text-xs text-gray-300 space-y-1">
          <p><span className="text-gray-500">Tahap:</span> {STAGES.find(s => s.value === stage)?.label}</p>
          {gelarTgl && <p><span className="text-gray-500">Gelar:</span> {gelarTgl}</p>}
          {gelarNo && <p><span className="text-gray-500">Notulen:</span> {gelarNo}</p>}
          {hasil && <p><span className="text-gray-500">Hasil:</span> {hasil === "terbukti" ? "Terbukti" : hasil === "perdamaian" ? "Perdamaian" : "Tidak Terbukti"}</p>}
          {pelimpahan && <p><span className="text-gray-500">Pelimpahan:</span> {pelimpahan}</p>}
          {tlList.filter(t => t.checked).length > 0 && (
            <p><span className="text-gray-500">Tindak Lanjut:</span>{" "}{tlList.filter(t => t.checked).map(t => t.label).join(", ")}</p>
          )}
          {pelanggarList.filter(p => p.nama.trim()).length > 0 && (
            <div>
              <p className="text-gray-500">Pelanggar:</p>
              {pelanggarList.filter(p => p.nama.trim()).map((p, i) => (
                <p key={i} className="ml-2">- {p.nama} / {p.pangkat} / NRP: {p.nrp}</p>
              ))}
            </div>
          )}
        </div>
        {pengaduan.unit_progress && (
          <p className="text-xs text-gray-400">{pengaduan.unit_progress}</p>
        )}
        <button onClick={() => window.open(`/cetak/${pengaduanId}`, "_blank")}
          className="flex items-center justify-center gap-1 w-full text-xs px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded mt-2">
          <Printer className="w-3 h-3" /> Cetak Lembar Informasi
        </button>
        <button onClick={salinRekap}
          className="flex items-center justify-center gap-1 w-full text-xs px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Tersalin!" : "Salin Rekap"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 mb-1">Ringkasan</p>
      <div className="text-xs text-gray-300 space-y-1">
        <p><span className="text-gray-500">Tahap:</span> {STAGES.find(s => s.value === stage)?.label}</p>
        {gelarTgl && <p><span className="text-gray-500">Gelar:</span> {gelarTgl}</p>}
        {gelarNo && <p><span className="text-gray-500">Notulen:</span> {gelarNo}</p>}
        {hasil && <p><span className="text-gray-500">Hasil:</span> {hasil === "terbukti" ? "Terbukti" : hasil === "perdamaian" ? "Perdamaian" : "Tidak Terbukti"}</p>}
        {pelimpahan && <p><span className="text-gray-500">Pelimpahan:</span> {pelimpahan}</p>}
        {tlList.filter(t => t.checked).length > 0 && (
          <p><span className="text-gray-500">Tindak Lanjut:</span>{" "}{tlList.filter(t => t.checked).map(t => t.label).join(", ")}</p>
        )}
        {pelanggarList.filter(p => p.nama.trim()).length > 0 && (
          <p><span className="text-gray-500">Pelanggar:</span>{" "}{pelanggarList.filter(p => p.nama.trim()).map(p => p.nama).join(", ")}</p>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}

      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
        <input type="checkbox" checked={skipGajamada} onChange={e => onToggleSkip(e.target.checked)}
          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Jangan update timeline Gajamada
      </label>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Send className="w-3 h-3 mr-1 inline" />}
        {stage === "pelaporan" ? "Selesai & Kirim" : "Update Progress"}
      </button>
      <button onClick={() => window.open(`/cetak/${pengaduanId}`, "_blank")}
        className="flex items-center justify-center gap-1 w-full text-xs px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded">
        <Printer className="w-3 h-3" /> Cetak Lembar Informasi
      </button>
      <button onClick={salinRekap}
        className="flex items-center justify-center gap-1 w-full text-xs px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded">
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Tersalin!" : "Salin Rekap"}
      </button>
    </div>
  )
}
