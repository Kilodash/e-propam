"use client"

import { Copy, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PELIMPAHAN_TARGETS, type TindakLanjutTabProps } from "./paminal-shared"
import { DocBlock } from "./doc-block"
import type { DocBlock as DocBlockType } from "./paminal-shared"

interface Props extends TindakLanjutTabProps {
  isDone: boolean
  targetStatus: string
  onSetTargetStatus: (v: string) => void
  sprinHenti: DocBlockType
  setSprinHenti: React.Dispatch<React.SetStateAction<DocBlockType>>
  pemAnkum: DocBlockType
  setPemAnkum: React.Dispatch<React.SetStateAction<DocBlockType>>
  suratMabes: DocBlockType
  setSuratMabes: React.Dispatch<React.SetStateAction<DocBlockType>>
  strJukrah: DocBlockType
  setStrJukrah: React.Dispatch<React.SetStateAction<DocBlockType>>
  showSuratMabes: boolean
  setShowSuratMabes: React.Dispatch<React.SetStateAction<boolean>>
  showStrJukrah: boolean
  setShowStrJukrah: React.Dispatch<React.SetStateAction<boolean>>
  tlDocBlocks: Record<string, DocBlockType>
  setTlDocBlocks: React.Dispatch<React.SetStateAction<Record<string, DocBlockType>>>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
}

export default function TindakLanjutTab({
  hasil, tlList, pelanggarList, pelimpahan, unitOptions,
  onToggleTl, onSetTlNomor, onSetPelimpahan,
  copied, onSalinRekap,
  isDone, targetStatus, onSetTargetStatus,
  sprinHenti, setSprinHenti,
  pemAnkum, setPemAnkum,
  suratMabes, setSuratMabes,
  strJukrah, setStrJukrah,
  showSuratMabes, setShowSuratMabes,
  showStrJukrah, setShowStrJukrah,
  tlDocBlocks, setTlDocBlocks,
  customTemplates, onSimpanDok,
}: Props) {
  const isTerbukti = hasil === "terbukti"
  const isTidakTerbukti = hasil === "tidak_terbukti"

  if (isDone) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-green-400 text-center">Proses sudah selesai</p>
        {pelimpahan && (
          <p className="text-sm text-gray-400 text-center">Dilimpahkan → {pelimpahan}</p>
        )}
        {tlList.filter(t => t.checked).length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-400">Tindak Lanjut:</p>
            {tlList.filter(t => t.checked).map(t => (
              <p key={t.key} className="text-sm text-gray-300">{t.label} — No: {t.nomor || "-"}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isTerbukti && (
        <>
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-yellow-400 mb-1">Pelimpahan (terbukti)</p>
            <Select value={pelimpahan} onValueChange={(v) => onSetPelimpahan(v ?? "")}>
              <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                <SelectValue placeholder="Pilih target pelimpahan..." />
              </SelectTrigger>
              <SelectContent>
                {PELIMPAHAN_TARGETS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label} — {t.statusLabel}</SelectItem>
                ))}
                <SelectItem value="custom">Lainnya (input manual)</SelectItem>
              </SelectContent>
            </Select>
            {pelimpahan === "custom" && (
              <input type="text" value=""
                onChange={e => onSetPelimpahan(e.target.value)}
                placeholder="Nama unit tujuan..."
                className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600 mt-1" />
            )}
            {pelimpahan && pelimpahan !== "custom" && (
              <p className="text-sm text-blue-400">
                Status: {PELIMPAHAN_TARGETS.find(t => t.value === pelimpahan)?.statusLabel ?? "Laporan Dikirim ke Satker"}
              </p>
            )}
          </div>
          <hr className="border-gray-700" />
        </>
      )}

      {isTidakTerbukti && (
        <>
          <p className="text-sm font-semibold text-red-400 mb-1">Tidak Terbukti — wajib upload:</p>
          <DocBlock title="Sprin Henti Lidik" docType="sprin_henti" block={sprinHenti} setter={setSprinHenti} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
          <hr className="border-gray-700" />
          <DocBlock title="Pemberitahuan ke Ankum" docType="pem_ankum" block={pemAnkum} setter={setPemAnkum} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
          <hr className="border-gray-700" />
        </>
      )}

      <p className="text-sm font-semibold text-gray-400 mb-1">Tindak Lanjut Wajib</p>
      {tlList.map((tl, idx) => {
        const block = tlDocBlocks[tl.key] || { tanggal: "", nomor: "", files: [] as File[], uploadedFiles: [] as { url: string; file_name: string }[], saving: false, saved: false }
        return (
          <div key={tl.key} className="space-y-1">
            <label className="flex items-center gap-1 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={tl.checked} onChange={() => onToggleTl(idx)}
                className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
              {tl.label}
            </label>
            {tl.checked && (
              <DocBlock title={tl.label} docType={tl.key} block={block}
                setter={(updater) => {
                  setTlDocBlocks(prev => {
                    const newBlock = typeof updater === "function"
                      ? (updater as (p: DocBlockType) => DocBlockType)(prev[tl.key] || block)
                      : updater
                    return { ...prev, [tl.key]: newBlock }
                  })
                }}
                customTemplates={customTemplates}
                onSimpanDok={onSimpanDok} />
            )}
          </div>
        )
      })}

      <hr className="border-gray-700" />
      <p className="text-sm font-semibold text-gray-500 mb-1">Dokumen Opsional</p>
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={showSuratMabes} onChange={e => setShowSuratMabes(e.target.checked)}
            className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
          Surat ke Mabes
        </label>
        {showSuratMabes && (
          <DocBlock title="Surat ke Mabes" docType="surat" block={suratMabes} setter={setSuratMabes} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
        )}
        <label className="flex items-center gap-1 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={showStrJukrah} onChange={e => setShowStrJukrah(e.target.checked)}
            className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
          STR Jukrah
        </label>
        {showStrJukrah && (
          <DocBlock title="STR Jukrah" docType="str_jukrah" block={strJukrah} setter={setStrJukrah} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
        )}
      </div>

      {pelanggarList.length > 0 && (
        <div className="bg-[#1E293B] border border-gray-600 rounded p-2 space-y-1">
          <p className="text-sm font-semibold text-yellow-400">Data Terlapor</p>
          {pelanggarList.map((p, i) => (
            <div key={i} className="text-sm text-gray-300">
              <p>{p.nama} — {p.pangkat} — NRP: {p.nrp}</p>
              <p className="text-gray-500">{p.jabatan} | {p.kesatuan}</p>
              {p.pasal_disiplin.length > 0 && <p className="text-blue-300">Disiplin: {p.pasal_disiplin.join(", ")}</p>}
              {p.pasal_kke.length > 0 && <p className="text-purple-300">KKE: {p.pasal_kke.join(", ")}</p>}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onSalinRekap}
        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? "Tersalin!" : "Salin Rekap"}
      </button>
    </div>
  )
}
