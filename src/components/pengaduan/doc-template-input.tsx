"use client"

import { useState, useRef } from "react"
import { X, Plus, Upload } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildNomor } from "@/lib/template-nomor"
import { getRomanMonths } from "@/lib/roman-month"

export interface DocEntry {
  key: string
  doc_type: string
  nomor_urut: string
  bulan: number
  tahun: number
  file_url?: string
}

const romanMonths = getRomanMonths()
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

interface DocTemplateInputProps {
  docTypes: { value: string; label: string }[]
  unit: string
  entry: DocEntry
  onChange: (entry: DocEntry) => void
  onRemove: () => void
  showRemove: boolean
  pengaduanId?: string
  className?: string
}

export function DocTemplateInput({
  docTypes,
  unit,
  entry,
  onChange,
  onRemove,
  showRemove,
  pengaduanId,
  className = "",
}: DocTemplateInputProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const preview = entry.doc_type
    ? buildNomor(entry.doc_type, entry.nomor_urut || "__", entry.bulan, entry.tahun, unit)
    : ""

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pengaduanId) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("pengaduan_id", pengaduanId)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onChange({ ...entry, file_url: json.url })
    } catch (err: any) {
      console.error("Upload failed:", err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Select value={entry.doc_type} onValueChange={(v) => onChange({ ...entry, doc_type: v ?? "" })}>
        <SelectTrigger className="w-[120px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 h-7">
          <SelectValue placeholder="Jenis..." />
        </SelectTrigger>
        <SelectContent>
          {docTypes.map(d => (
            <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        type="text"
        value={entry.nomor_urut}
        onChange={(e) => onChange({ ...entry, nomor_urut: e.target.value })}
        placeholder="No"
        className="w-12 text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7 placeholder:text-gray-500"
      />
      <Select value={String(entry.bulan)} onValueChange={(v) => onChange({ ...entry, bulan: parseInt(v ?? "1") })}>
        <SelectTrigger className="w-[60px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 h-7">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {romanMonths.map(m => (
            <SelectItem key={m.value} value={String(m.value)} className="text-xs">{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(entry.tahun)} onValueChange={(v) => onChange({ ...entry, tahun: parseInt(v ?? String(currentYear)) })}>
        <SelectTrigger className="w-[68px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 h-7">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => (
            <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {preview && (
        <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{preview}</span>
      )}
      {pengaduanId && (
        <>
          <input
            ref={fileRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`text-gray-400 hover:text-blue-400 p-0.5 ${entry.file_url ? "text-green-400" : ""}`}
            title={entry.file_url ? "File terupload" : "Upload file"}
          >
            <Upload className="w-3 h-3" />
          </button>
        </>
      )}
      {showRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 p-0.5"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

interface DocEntryListProps {
  entries: DocEntry[]
  onChange: (entries: DocEntry[]) => void
  docTypes: { value: string; label: string }[]
  unit: string
  pengaduanId?: string
}

export function DocEntryList({ entries, onChange, docTypes, unit, pengaduanId }: DocEntryListProps) {
  function updateEntry(idx: number, updated: DocEntry) {
    const next = [...entries]
    next[idx] = updated
    onChange(next)
  }

  function removeEntry(idx: number) {
    onChange(entries.filter((_, i) => i !== idx))
  }

  function addEntry() {
    onChange([...entries, {
      key: crypto.randomUUID(),
      doc_type: "",
      nomor_urut: "",
      bulan: new Date().getMonth() + 1,
      tahun: currentYear,
    }])
  }

  return (
    <div className="space-y-1">
      {entries.map((entry, idx) => (
        <DocTemplateInput
          key={entry.key}
          docTypes={docTypes}
          unit={unit}
          pengaduanId={pengaduanId}
          entry={entry}
          onChange={(e) => updateEntry(idx, e)}
          onRemove={() => removeEntry(idx)}
          showRemove={entries.length > 1}
        />
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Tambah Dokumen
      </button>
    </div>
  )
}
