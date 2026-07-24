"use client"

import { Trash2, Save, RotateCcw, Paperclip } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import { buildNomor } from "@/lib/template-nomor"
import type { PelanggarItem } from "../paminal/paminal-shared"
import { PUTUSAN_KKEP, SANKSI_ETIKA, SANKSI_ADMINISTRATIF } from "./wabprof-shared"
import type { SidangKkepEntry, PutusanKkepValue } from "./wabprof-shared"

interface Props {
  entry: SidangKkepEntry
  index: number
  pelanggarOptions: PelanggarItem[]
  usedOtherKeys: Set<string>
  onUpdate: (key: string, updates: Partial<SidangKkepEntry>) => void
  onDelete: (key: string) => void
  customTemplates: Record<string, string>
  onSimpanKhd?: (key: string) => Promise<void>
}

export default function SidangKkepEntryComp({
  entry, index, pelanggarOptions, usedOtherKeys, onUpdate, onDelete, customTemplates, onSimpanKhd,
}: Props) {
  function handleTglSidang(val: string) {
    let nextNomor = entry.khdNomor
    if (val && !nextNomor) {
      const d = new Date(val + "T00:00:00")
      nextNomor = buildNomor("khd", "     ", d.getMonth() + 1, d.getFullYear(), "Subbid Wabprof", customTemplates)
    }
    onUpdate(entry.key, { khdTanggal: val, khdNomor: nextNomor })
  }

  function togglePutusan(v: PutusanKkepValue) {
    const next = entry.putusan.includes(v)
      ? entry.putusan.filter(p => p !== v)
      : [...entry.putusan, v]
    onUpdate(entry.key, { putusan: next })
  }

  return (
    <div className="border border-gray-600 rounded p-3 space-y-2.5 bg-[#0F172A]">
      <div className="flex items-center justify-between border-b border-gray-700 pb-1.5">
        <span className="text-sm font-semibold text-purple-300">Sidang KKEP #{index + 1}</span>
        <button onClick={() => onDelete(entry.key)} className="text-red-400 hover:text-red-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Identitas Terduga Pelanggar */}
      <div>
        <p className="text-sm font-semibold text-gray-300 mb-1">Terduga Pelanggar yang Disidangkan</p>
        {pelanggarOptions.length === 0 ? (
          <p className="text-xs text-amber-400">Belum ada data pelanggar. Silakan isi Data Pelanggar di atas terlebih dahulu.</p>
        ) : (
          <div className="space-y-1 bg-[#1E293B] p-2 rounded border border-gray-700 max-h-36 overflow-y-auto">
            {pelanggarOptions.filter(p => p.nama).map(p => {
              const isSelected = (entry.pelanggarKeys || []).includes(p.key)
              const isUsedElsewhere = usedOtherKeys.has(p.key) && !isSelected

              return (
                <label
                  key={p.key}
                  className={`flex items-center gap-2 text-sm p-1 rounded cursor-pointer ${
                    isUsedElsewhere ? "opacity-40 cursor-not-allowed text-gray-500" : "hover:bg-gray-700/50 text-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={isUsedElsewhere}
                    checked={isSelected}
                    onChange={() => {
                      const nextKeys = isSelected
                        ? (entry.pelanggarKeys || []).filter(k => k !== p.key)
                        : [...(entry.pelanggarKeys || []), p.key]
                      onUpdate(entry.key, { pelanggarKeys: nextKeys })
                    }}
                    className="w-4 h-4 rounded border-gray-500 bg-[#0F172A] accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span>
                      <strong className="text-white">{p.nama}</strong> ({p.pangkat || "-"} / NRP: {p.nrp || "-"})
                    </span>
                    {isUsedElsewhere && (
                      <span className="text-xs text-amber-400 font-semibold ml-2">(Sudah Disidangkan)</span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Tempat Pelaksanaan Sidang KKEP */}
      <div>
        <p className="text-sm text-gray-500 mb-0.5">Tempat Pelaksanaan Sidang KKEP</p>
        <input type="text" value={entry.tempatSidang || ""}
          onChange={e => onUpdate(entry.key, { tempatSidang: e.target.value })}
          placeholder="Ruang Sidang KKEP (Subbid Wabprof Polda Jabar / Polres...)"
          className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
      </div>

      {/* Tanggal & Nomor Putusan */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Tanggal Sidang KKEP</p>
          <DateInput value={entry.khdTanggal} onChange={handleTglSidang}
            className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm text-gray-500">Nomor Keputusan / Putusan KKEP</p>
            {entry.khdSaved && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium" title="Putusan KKEP Tersimpan">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] shrink-0 animate-pulse"></span>
                Tersimpan
              </span>
            )}
            {entry.khdSaveError && !entry.khdSaved && (
              <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium" title="Gagal Menyimpan Putusan KKEP">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] shrink-0"></span>
                Gagal Simpan
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input type="text" value={entry.khdNomor}
              onChange={e => onUpdate(entry.key, { khdNomor: e.target.value, khdSaveError: false })}
              placeholder="PUT/___/VII/KEP/2026/..."
              className={`w-full text-sm bg-[#1E293B] border text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600 ${
                entry.khdSaved
                  ? "border-emerald-500/70 focus:border-emerald-400"
                  : entry.khdSaveError
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-gray-600"
              }`} />
            {entry.khdSaved && (
              <span className="absolute right-2.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] pointer-events-none"></span>
            )}
            {entry.khdSaveError && !entry.khdSaved && (
              <span className="absolute right-2.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] pointer-events-none"></span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1.5">
        <button onClick={() => onSimpanKhd?.(entry.key)} disabled={!entry.khdTanggal || !entry.khdNomor}
          className="flex items-center gap-1 text-sm px-2 py-1 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
          <Save className="w-3 h-3" /> Simpan Putusan
        </button>
        <button onClick={() => onUpdate(entry.key, { khdTanggal: "", khdNomor: "", khdFiles: [], khdUploadedFiles: [] })}
          className="flex items-center gap-1 text-sm px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <label className="flex items-center gap-1 text-sm px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded cursor-pointer">
          <Paperclip className="w-3 h-3" /> Upload Dokumen
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={e => {
            if (e.target.files) onUpdate(entry.key, { khdFiles: [...entry.khdFiles, ...Array.from(e.target.files)] })
          }} />
        </label>
      </div>

      {/* Sanksi & Putusan KKEP (Perpol No 7 Tahun 2022) */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-amber-300">Amar Putusan & Sanksi KKEP (Perpol No. 7 Tahun 2022)</p>
        
        {/* Sanksi Etika */}
        <div className="bg-[#1E293B] p-2 rounded border border-gray-700 space-y-1">
          <p className="text-xs font-semibold text-emerald-400 border-b border-gray-700 pb-1 mb-1">A. Sanksi Etika (Kategori Ringan — Pasal 108)</p>
          {SANKSI_ETIKA.map(v => (
            <label key={v} className="flex items-start gap-2 text-sm text-gray-200 py-0.5 cursor-pointer hover:bg-gray-700/40 px-1 rounded">
              <input type="checkbox" checked={entry.putusan.includes(v)} onChange={() => togglePutusan(v)}
                className="mt-0.5 w-4 h-4 rounded border-gray-500 bg-[#0F172A] accent-emerald-500 cursor-pointer" />
              <span className="text-xs leading-relaxed">{v}</span>
            </label>
          ))}
        </div>

        {/* Sanksi Administratif */}
        <div className="bg-[#1E293B] p-2 rounded border border-gray-700 space-y-1">
          <p className="text-xs font-semibold text-purple-400 border-b border-gray-700 pb-1 mb-1">B. Sanksi Administratif (Kategori Sedang & Berat — Pasal 109)</p>
          {SANKSI_ADMINISTRATIF.map(v => (
            <label key={v} className="flex items-start gap-2 text-sm text-gray-200 py-0.5 cursor-pointer hover:bg-gray-700/40 px-1 rounded">
              <input type="checkbox" checked={entry.putusan.includes(v)} onChange={() => togglePutusan(v)}
                className="mt-0.5 w-4 h-4 rounded border-gray-500 bg-[#0F172A] accent-purple-500 cursor-pointer" />
              <span className="text-xs leading-relaxed">{v}</span>
            </label>
          ))}
        </div>

        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-0.5">Catatan Putusan / Pertimbangan KKEP</p>
          <textarea value={entry.catatan}
            onChange={e => onUpdate(entry.key, { catatan: e.target.value })}
            placeholder="Catatan pertimbangan persidangan..."
            rows={2}
            className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 py-1 placeholder:text-gray-600 resize-none" />
        </div>
      </div>

      <hr className="border-gray-700" />

      {/* Banding KKEP */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-gray-300">Permohonan Banding KKEP</p>
        <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={entry.banding} onChange={e => onUpdate(entry.key, { banding: e.target.checked })}
            className="w-4 h-4 rounded border-gray-500 bg-[#1E293B] accent-purple-500 cursor-pointer" />
          Mengajukan Banding KKEP
        </label>
        {entry.banding && (
          <div className="grid grid-cols-2 gap-1.5 pl-5">
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Tanggal Permohonan Banding</p>
              <DateInput value={entry.bandingTanggal} onChange={v => onUpdate(entry.key, { bandingTanggal: v })}
                className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Nomor Memori / Surat Banding</p>
              <input type="text" value={entry.bandingMemo}
                onChange={e => onUpdate(entry.key, { bandingMemo: e.target.value })}
                placeholder="Nomor memori banding..."
                className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
