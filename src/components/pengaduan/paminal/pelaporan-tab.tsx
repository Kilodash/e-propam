"use client"

import { Loader2, Send } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocBlock } from "./doc-block"
import type { DocBlock as DocBlockType, PelanggarItem } from "./paminal-shared"
import { validateNrp } from "./paminal-shared"

interface Props {
  hasil: string
  onSetHasil: (v: string) => void
  onSetPelimpahan: (v: string) => void
  gelarBlock: DocBlockType
  setGelarBlock: React.Dispatch<React.SetStateAction<DocBlockType>>
  lhp: DocBlockType
  setLhp: React.Dispatch<React.SetStateAction<DocBlockType>>
  nodin: DocBlockType
  setNodin: React.Dispatch<React.SetStateAction<DocBlockType>>
  skipGajamada: boolean
  onToggleSkip: (v: boolean) => void
  loading: boolean
  pelanggarList: PelanggarItem[]
  onStageUpdate: (hasil: string) => Promise<void>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
}

export default function PelaporanTab({
  hasil, onSetHasil, onSetPelimpahan,
  gelarBlock, setGelarBlock,
  lhp, setLhp, nodin, setNodin,
  skipGajamada, onToggleSkip, loading,
  pelanggarList, onStageUpdate,
  customTemplates, onSimpanDok,
}: Props) {
  async function handleClick() {
    if (hasil === "terbukti") {
      const invalid: string[] = []
      pelanggarList.forEach((p, i) => {
        const required: { field: string; val: string }[] = [
          { field: "Nama", val: p.nama }, { field: "Pangkat", val: p.pangkat }, { field: "NRP", val: p.nrp }, { field: "Wujud Perbuatan", val: p.wujud },
        ]
        if (pelanggarList.length === 1) {
          const anyFilled = required.some(r => r.val.trim())
          if (!anyFilled) return
        }
        required.forEach(r => { if (!r.val.trim()) invalid.push(`Pelanggar ${i + 1}: ${r.field} wajib diisi`) })
        if (p.nrp) {
          const v = validateNrp(p.nrp, p.tanggal_lahir)
          if (v.warning && !v.valid) invalid.push(`Pelanggar ${i + 1}: ${v.warning}`)
        }
        if (!p.pasal_disiplin.length && !p.pasal_kke.length) invalid.push(`Pelanggar ${i + 1}: minimal satu pasal wajib dipilih`)
      })
      if (invalid.length > 0) return
    }
    await onStageUpdate(hasil)
  }

  return (
    <div className="space-y-3">
      <DocBlock title="Gelar Perkara" docType="notulen_gelar" block={gelarBlock} setter={setGelarBlock} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="LHP" docType="lhp" block={lhp} setter={setLhp} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Nota Dinas" docType="nota_dinas" block={nodin} setter={setNodin} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-green-400 mb-1">Hasil Lidik</p>
        <Select value={hasil} onValueChange={(v) => { onSetHasil(v ?? ""); if (v !== "terbukti") onSetPelimpahan("") }}>
          <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
            <SelectValue placeholder="Pilih hasil..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
            <SelectItem value="terbukti">Terbukti</SelectItem>
            <SelectItem value="perdamaian">Perdamaian</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <hr className="border-gray-700" />
      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
        <input type="checkbox" checked={skipGajamada} onChange={e => onToggleSkip(e.target.checked)}
          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Jangan update timeline Gajamada
      </label>
      <button onClick={handleClick} disabled={loading || !hasil}
        className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        Update Status → {hasil === "terbukti" ? "LAPORAN SELESAI" : hasil === "perdamaian" ? "RESTORATIVE JUSTICE" : hasil === "tidak_terbukti" ? "TIDAK TERBUKTI" : "Pilih Hasil"}
      </button>
    </div>
  )
}
