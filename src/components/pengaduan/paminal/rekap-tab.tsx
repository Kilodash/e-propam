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
  dokumenList: { doc_type: string; nomor: string; tanggal: string }[]
  pelimpahanKe: string
  pelimpahanNomor: string
  pelimpahanTgl: string
}

export default function RekapTab({
  stage, hasil, gelarTgl, gelarNo, tlList, pelanggarList, pelimpahan,
  error, success, updateGajamada, onToggleUpdate, onSubmit, loading, pengaduan, isDone,
  pengaduanId,
  dokumenList, pelimpahanKe, pelimpahanNomor, pelimpahanTgl,
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

  const DOC_LABEL: Record<string, string> = {
    pemberitahuan_awal: "Pemberitahuan Awal",
    uuk: "UUK",
    sprinlidik: "Sprin Lidik",
    notulen_gelar: "Notulen Gelar",
    lhp: "LHP",
    nota_dinas: "Nota Dinas",
    sp2hp2: "SP2HP2",
    sprin_henti: "Sprin Henti Lidik",
    pem_ankum: "Pemberitahuan ke Ankum",
    pem_pelapor: "Pemberitahuan ke Pelapor",
    surat: "Surat Pelimpahan",
    str_jukrah: "STR Jukrah",
  }

  const allDocs = [...dokumenList]
  if (pelimpahanKe && pelimpahanNomor) {
    allDocs.push({ doc_type: "surat", nomor: pelimpahanNomor, tanggal: pelimpahanTgl })
  }

  const formatTgl = (d: string) => {
    if (!d) return "-"
    return new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
  }

  const renderDokumenList = () => (
    <div className="text-sm text-gray-300 space-y-0.5">
      {allDocs.length === 0 && <p className="text-gray-500 italic">Belum ada dokumen tersimpan</p>}
      {allDocs.map((doc, i) => (
        <p key={i}>
          <span className="text-gray-500">{i + 1}. {DOC_LABEL[doc.doc_type] || doc.doc_type}</span>
          {doc.nomor ? <span className="text-gray-300"> — No: {doc.nomor}</span> : ""}
          {doc.tanggal ? <span className="text-gray-500">, {formatTgl(doc.tanggal)}</span> : ""}
        </p>
      ))}
      {pelimpahanKe && (
        <p className="text-yellow-400 pt-1">
          Dilimpahkan ke {pelimpahanKe}
          {pelimpahanNomor ? <span className="text-gray-300"> — No: {pelimpahanNomor}</span> : ""}
          {pelimpahanTgl ? <span className="text-gray-500">, {formatTgl(pelimpahanTgl)}</span> : ""}
        </p>
      )}
    </div>
  )

  if (isDone) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-400">Ringkasan Final</p>
        {renderDokumenList()}
        {pengaduan.unit_progress && (
          <p className="text-sm text-gray-400">{pengaduan.unit_progress}</p>
        )}
        <button onClick={() => window.open(`/cetak/${pengaduanId}`, "_blank")}
          className="flex items-center justify-center gap-1 w-full text-sm px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded mt-2">
          <Printer className="w-3 h-3" /> Cetak Lembar Informasi
        </button>
        <button onClick={salinRekap}
          className="flex items-center justify-center gap-1 w-full text-sm px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Tersalin!" : "Salin Rekap"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-400 mb-1">Ringkasan</p>
      {renderDokumenList()}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}

      <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer mb-1.5">
        <input type="checkbox" checked={updateGajamada} onChange={e => onToggleUpdate(e.target.checked)}
          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Update Timeline Gajamada
      </label>
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-sm rounded disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Send className="w-3 h-3 mr-1 inline" />}
          {stage === "pelaporan" ? "Selesai & Kirim" : "Update Progress"}
        </button>
        <button onClick={() => window.open(`/cetak/${pengaduanId}`, "_blank")}
          className="flex items-center justify-center gap-1 text-sm px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded">
          <Printer className="w-3 h-3" /> Cetak
        </button>
        <button onClick={salinRekap}
          className="flex items-center justify-center gap-1 text-sm px-2 py-1.5 border border-gray-600 text-gray-300 hover:text-white rounded">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Tersalin!" : "Salin"}
        </button>
      </div>
    </div>
  )
}
