"use client"

import { Loader2, Save, Check, RotateCcw, Paperclip } from "lucide-react"
import { DateInput } from "@/components/ui/date-input"
import { buildNomor } from "@/lib/template-nomor"
import type { DocBlock } from "./paminal-shared"

export type DocBlockProps = {
  title: string
  docType: string
  block: DocBlock
  setter: React.Dispatch<React.SetStateAction<DocBlock>>
  customTemplates: Record<string, string>
  onSimpanDok: (docType: string, block: DocBlock, setter: React.Dispatch<React.SetStateAction<DocBlock>>) => Promise<void>
}

const autoFillDocTypes = ["pemberitahuan_awal", "uuk", "sprinlidik", "notulen_gelar", "lhp", "nota_dinas"]

export function DocBlock({ title, docType, block, setter, customTemplates, onSimpanDok }: DocBlockProps) {
  function handleTanggal(val: string) {
    setter(prev => {
      let nextNomor = prev.nomor
      if (val && autoFillDocTypes.includes(docType)) {
        const d = new Date(val + "T00:00:00")
        const generated = buildNomor(docType, "     ", d.getMonth() + 1, d.getFullYear(), "Subbid Paminal", customTemplates)
        if (!prev.nomor) {
          nextNomor = generated
        } else {
          const tpl = (customTemplates && customTemplates[docType]) ? customTemplates[docType] : "{no}/{rom}/{thn}/{unit}"
          const parts = tpl.split("{no}")
          if (parts.length === 2 && prev.nomor.startsWith(parts[0])) {
            const afterPrefix = prev.nomor.substring(parts[0].length)
            const possibleNo = afterPrefix.split("/")[0]
            nextNomor = buildNomor(docType, possibleNo, d.getMonth() + 1, d.getFullYear(), "Subbid Paminal", customTemplates)
          } else {
            nextNomor = generated
          }
        }
      }
      return { ...prev, tanggal: val, nomor: nextNomor }
    })
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-gray-300">{title}</p>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Tanggal</p>
          <DateInput value={block.tanggal} onChange={handleTanggal}
            className="text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-0.5">Nomor Lengkap</p>
          <input type="text" value={block.nomor}
            onChange={e => setter(p => ({ ...p, nomor: e.target.value }))}
            placeholder="Isi nomor lengkap..."
            className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
        </div>
      </div>
      <div className="flex gap-1.5 items-center">
        <button onClick={() => onSimpanDok(docType, block, setter)} disabled={block.saving || !block.tanggal || !block.nomor}
          className="flex items-center gap-1 text-sm px-2 py-1 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
          {block.saving ? <Loader2 className="w-3 h-3 animate-spin" /> : block.saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {block.saved ? "Tersimpan" : "Simpan"}
        </button>
        <button onClick={() => setter(p => ({ ...p, tanggal: "", nomor: "", saving: false, saved: false }))} className="flex items-center gap-1 text-sm px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded">
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <label className="flex items-center gap-1 text-sm px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded cursor-pointer">
          <Paperclip className="w-3 h-3" /> Upload
          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={e => {
            if (e.target.files) {
              const arr = Array.from(e.target.files)
              setter(p => ({ ...p, files: [...p.files, ...arr] }))
            }
          }} />
        </label>
      </div>
      {(block.files.length > 0 || block.uploadedFiles.length > 0) && (
        <div className="bg-[#1E293B] rounded p-1.5 mt-1 border border-gray-600">
          <p className="text-sm text-gray-400 mb-1">File Terlampir:</p>
          <ul className="space-y-0.5">
            {block.uploadedFiles.map((f, i) => (
              <li key={`up-${i}`} className="flex items-center justify-between text-sm text-gray-200">
                <span className="truncate text-green-400">{f.file_name}</span>
              </li>
            ))}
            {block.files.map((f, i) => (
              <li key={`new-${i}`} className="flex items-center justify-between text-sm text-gray-200">
                <span className="truncate text-yellow-400">{f.name} (belum disimpan)</span>
                <button onClick={() => setter(p => ({ ...p, files: p.files.filter((_, idx) => idx !== i) }))} className="text-red-400 hover:text-red-300 ml-2 shrink-0">Hapus</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
