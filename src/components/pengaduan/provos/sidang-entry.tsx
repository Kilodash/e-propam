"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import { buildNomor } from "@/lib/template-nomor"
import type { PelanggarItem } from "../paminal/paminal-shared"
import type { SidangEntry as SidangEntryType, PutusanValue } from "./provos-shared"
import { PUTUSAN_SIDANG } from "./provos-shared"

interface Props {
  entry: SidangEntryType
  index: number
  pelanggarOptions: PelanggarItem[]
  onUpdate: (key: string, updates: Partial<SidangEntryType>) => void
  onDelete: (key: string) => void
  customTemplates: Record<string, string>
}

export default function SidangEntryComp({
  entry, index, pelanggarOptions, onUpdate, onDelete, customTemplates,
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
    <div className="border border-gray-600 rounded p-3 space-y-2 bg-[#0F172A]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">Sidang #{index + 1}</span>
        <button onClick={() => onDelete(entry.key)} className="text-red-400 hover:text-red-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-0.5">Identitas Terduga Pelanggar</p>
        {entry.pelanggar ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-200 bg-[#1E293B] px-2 py-0.5 rounded">
              {entry.pelanggar.nama} ({entry.pelanggar.pangkat}) — NRP: {entry.pelanggar.nrp}
            </span>
            <button onClick={() => onUpdate(entry.key, { pelanggar: null })} className="text-sm text-gray-500 hover:text-gray-300">Ganti</button>
          </div>
        ) : (
          <select
            onChange={e => {
              const val = e.target.value
              if (!val) return
              const found = pelanggarOptions.find(p => p.key === val)
              onUpdate(entry.key, { pelanggar: found as any })
            }}
            className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8"
          >
            <option value="">Pilih pelanggar...</option>
            {pelanggarOptions.filter(p => p.nama).map(p => (
              <option key={p.key} value={p.key}>{p.nama} / {p.pangkat} / {p.nrp}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Tanggal Sidang</p>
          <DateInput value={entry.khdTanggal} onChange={handleTglSidang}
            className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Nomor KHD</p>
          <input type="text" value={entry.khdNomor}
            onChange={e => onUpdate(entry.key, { khdNomor: e.target.value })}
            placeholder="KHD/___/VII/HUK.12.10./2026/..."
            className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
        </div>
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
      </div>

      <div className="space-y-1.5">
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
