"use client"

import { useState } from "react"
import { Trash2, Save, RotateCcw, Paperclip } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import { buildNomor } from "@/lib/template-nomor"
import type { PelanggarItem } from "../paminal/paminal-shared"
import type { SidangEntry as SidangEntryType, PutusanValue } from "./provos-shared"
import { PUTUSAN_SIDANG } from "./provos-shared"

interface Props {
  entry: SidangEntryType
  index: number
  pelanggarOptions: PelanggarItem[]
  usedOtherKeys: Set<string>
  onUpdate: (key: string, updates: Partial<SidangEntryType>) => void
  onDelete: (key: string) => void
  customTemplates: Record<string, string>
  onSimpanKhd?: (key: string) => Promise<void>
}

export default function SidangEntryComp({
  entry, index, pelanggarOptions, usedOtherKeys, onUpdate, onDelete, customTemplates, onSimpanKhd,
}: Props) {
  function handleTglSidang(val: string) {
    let nextNomor = entry.khdNomor
    if (val && !nextNomor) {
      const d = new Date(val + "T00:00:00")
      nextNomor = buildNomor("khd", "     ", d.getMonth() + 1, d.getFullYear(), "Subbid Provos", customTemplates)
    }
    onUpdate(entry.key, { khdTanggal: val, khdNomor: nextNomor })
  }

  function togglePutusan(v: PutusanValue) {
    const next = entry.putusan.includes(v)
      ? entry.putusan.filter(p => p !== v)
      : [...entry.putusan, v]
    onUpdate(entry.key, {
      putusan: next,
      patsusDiperberat: next.includes("Penempatan dalam tempat khusus paling lama 21 hari") ? entry.patsusDiperberat : false,
    })
  }

  const hasPatsus = entry.putusan.includes("Penempatan dalam tempat khusus paling lama 21 hari")

  return (
    <div className="border border-gray-600 rounded p-3 space-y-2.5 bg-[#0F172A]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">Sidang Disiplin #{index + 1}</span>
        <button onClick={() => onDelete(entry.key)} className="text-red-400 hover:text-red-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

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

      <div>
        <p className="text-sm text-gray-500 mb-0.5">Tempat Pelaksanaan Sidang</p>
        <input type="text" value={entry.tempatSidang || ""}
          onChange={e => onUpdate(entry.key, { tempatSidang: e.target.value })}
          placeholder="Ruang Sidang Disiplin (Subbid Provos / Polres...)"
          className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Tanggal Sidang</p>
          <DateInput value={entry.khdTanggal} onChange={handleTglSidang}
            className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm text-gray-500">Nomor KHD</p>
            {entry.khdSaved && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium" title="KHD Tersimpan">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)] shrink-0 animate-pulse"></span>
                Tersimpan
              </span>
            )}
            {entry.khdSaveError && !entry.khdSaved && (
              <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium" title="Gagal Menyimpan KHD">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] shrink-0"></span>
                Gagal Simpan
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input type="text" value={entry.khdNomor}
              onChange={e => onUpdate(entry.key, { khdNomor: e.target.value, khdSaveError: false })}
              placeholder="KHD/___/VII/HUK.12.10./2026/..."
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
          <Save className="w-3 h-3" /> Simpan
        </button>
        <button onClick={() => onUpdate(entry.key, { khdTanggal: "", khdNomor: "", khdFiles: [], khdUploadedFiles: [] })}
          className="flex items-center gap-1 text-sm px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <label className="flex items-center gap-1 text-sm px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded cursor-pointer">
          <Paperclip className="w-3 h-3" /> Upload
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={e => {
            if (e.target.files) onUpdate(entry.key, { khdFiles: [...entry.khdFiles, ...Array.from(e.target.files)] })
          }} />
        </label>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-0.5">Putusan Sidang</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {PUTUSAN_SIDANG.map(v => (
            <label key={v} className="flex items-start gap-1.5 text-sm text-gray-300 py-0.5 cursor-pointer">
              <input type="checkbox" checked={entry.putusan.includes(v)} onChange={() => togglePutusan(v)}
                className="mt-0.5 w-3 h-3 rounded border-gray-500 bg-[#1E293B] accent-blue-500" />
              <span>{v}</span>
            </label>
          ))}
        </div>
        {hasPatsus && (
          <label className="flex items-center gap-1.5 text-sm text-amber-400 mt-1 cursor-pointer">
            <input type="checkbox" checked={entry.patsusDiperberat} onChange={e => onUpdate(entry.key, { patsusDiperberat: e.target.checked })}
              className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
            <span>Pemberatan +7 hari (total 28 hari) — darurat/operasi atau pelanggaran &gt;3x berturut-turut</span>
          </label>
        )}

        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-0.5">Catatan Putusan</p>
          <textarea value={entry.catatan}
            onChange={e => onUpdate(entry.key, { catatan: e.target.value } as any)}
            placeholder="Catatan tambahan putusan sidang..."
            rows={2}
            className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 py-1 placeholder:text-gray-600 resize-none" />
        </div>
      </div>

      <hr className="border-gray-700" />

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-gray-300">Banding</p>
        <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" checked={entry.banding} onChange={e => onUpdate(entry.key, { banding: e.target.checked })}
            className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
          Mengajukan Banding (maks 14 hari setelah putusan)
        </label>
        {entry.banding && (
          <div className="grid grid-cols-2 gap-1.5 pl-5">
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Tanggal Banding</p>
              <DateInput value={entry.bandingTanggal} onChange={v => onUpdate(entry.key, { bandingTanggal: v })}
                className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
              {entry.khdTanggal && entry.bandingTanggal && (
                (() => {
                  const d1 = new Date(entry.bandingTanggal)
                  const d2 = new Date(entry.khdTanggal)
                  const diff = Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
                  if (diff > 14) return <p className="text-xs text-red-400 mt-0.5">Banding melebihi 14 hari ({diff} hari)</p>
                  return null
                })()
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Memo Banding (opsional)</p>
              <input type="text" value={entry.bandingMemo}
                onChange={e => onUpdate(entry.key, { bandingMemo: e.target.value })}
                placeholder="Nomor memo..."
                className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
