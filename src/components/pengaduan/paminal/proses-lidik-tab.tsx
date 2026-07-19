"use client"

import { Loader2, Play } from "lucide-react"
import { DocBlock } from "./doc-block"
import type { DocBlock as DocBlockType } from "./paminal-shared"

interface Props {
  skipGajamada: boolean
  onToggleSkip: (v: boolean) => void
  updatingStatus: boolean
  pemberitahuanAwal: DocBlockType
  setPemberitahuanAwal: React.Dispatch<React.SetStateAction<DocBlockType>>
  uuk: DocBlockType
  setUuk: React.Dispatch<React.SetStateAction<DocBlockType>>
  sprin: DocBlockType
  setSprin: React.Dispatch<React.SetStateAction<DocBlockType>>
  onUpdateStatusLidik: () => Promise<void>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlockType, setter: React.Dispatch<React.SetStateAction<DocBlockType>>) => Promise<void>
}

export default function ProsesLidikTab({
  skipGajamada, onToggleSkip, updatingStatus,
  pemberitahuanAwal, setPemberitahuanAwal,
  uuk, setUuk, sprin, setSprin,
  onUpdateStatusLidik, customTemplates, onSimpanDok,
}: Props) {
  return (
    <div className="space-y-3">
      <DocBlock title="Pemberitahuan Awal" docType="pemberitahuan_awal" block={pemberitahuanAwal} setter={setPemberitahuanAwal} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="UUK" docType="uuk" block={uuk} setter={setUuk} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <DocBlock title="Sprin Lidik" docType="sprinlidik" block={sprin} setter={setSprin} customTemplates={customTemplates} onSimpanDok={onSimpanDok} />
      <hr className="border-gray-700" />
      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
        <input type="checkbox" checked={skipGajamada} onChange={e => onToggleSkip(e.target.checked)}
          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
        Jangan update timeline Gajamada
      </label>
      <button onClick={onUpdateStatusLidik} disabled={updatingStatus}
        className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded disabled:opacity-40">
        {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
        Update Status → PROSES LIDIK
      </button>
    </div>
  )
}
