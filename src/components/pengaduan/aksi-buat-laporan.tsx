"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, FilePlus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DocEntryList, type DocEntry } from "./doc-template-input"
import { generateUUID } from "@/lib/uuid"

const currentYear = new Date().getFullYear()

const REPORT_DOC_TYPES = [
  { value: "surat_pengantar", label: "Surat Pengantar" },
  { value: "kronologi", label: "Kronologi" },
  { value: "identitas", label: "Identitas Terlapor" },
  { value: "bukti", label: "Bukti Pendukung" },
]

interface Props {
  role: string
}

export default function AksiBuatLaporan({ role }: Props) {
  const isPaminal = role === "paminal"
  const defaultType = isPaminal ? "lapinfo" : "lp_a"

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [sourceType, setSourceType] = useState(defaultType)
  const [perihal, setPerihal] = useState("")
  const [kronologi, setKronologi] = useState("")
  const [namaTerlapor, setNamaTerlapor] = useState("")
  const [nrpTerlapor, setNrpTerlapor] = useState("")
  const [jabatanTerlapor, setJabatanTerlapor] = useState("")
  const [kesatuanTerlapor, setKesatuanTerlapor] = useState("")
  const [docEntries, setDocEntries] = useState<DocEntry[]>([
    { key: generateUUID(), doc_type: "", nomor_urut: "", bulan: new Date().getMonth() + 1, tahun: currentYear },
  ])

  const router = useRouter()

  async function handleSubmit() {
    if (!perihal.trim()) { setError("Perihal wajib diisi"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/pengaduan/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: sourceType,
          source_unit: role,
          perihal,
          kronologi,
          author_email: `${role}@propam.polri.go.id`,
          author_role: role,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(`Laporan berhasil dibuat. Nomor: ${json.nomor}`)
      setOpen(false)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-auto bg-[#0369A1] hover:bg-[#0284c7] text-white h-10 text-sm rounded flex items-center justify-center gap-1 px-3"
      >
        <FilePlus className="w-3 h-3" /> Buat Laporan Baru
      </button>
    )
  }

  const unitLabel = role === "paminal" ? "Subbid Paminal"
    : role === "provos" ? "Subbid Provos"
    : role === "wabprof" ? "Subbid Wabprof"
    : role

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20">
      <div className="bg-[#0F172A] border border-gray-700 rounded-lg w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Buat Laporan Baru</h2>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-lg">&times;</button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Jenis Laporan</p>
            <Select value={sourceType} onValueChange={(v) => setSourceType(v ?? "lapinfo")}>
              <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isPaminal && <SelectItem value="lapinfo">Laporan Informasi (Paminal)</SelectItem>}
                <SelectItem value="lp_a">LP Model A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Perihal</p>
            <input
              type="text"
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              className="w-full text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-2 h-8 placeholder:text-gray-500"
              placeholder="Perihal laporan..."
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Kronologi</p>
            <Textarea
              value={kronologi}
              onChange={(e) => setKronologi(e.target.value)}
              className="min-h-[80px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
              placeholder="Uraian kronologi kejadian..."
            />
          </div>

          <fieldset className="border border-gray-600 rounded p-2">
            <legend className="text-xs font-semibold text-gray-400 px-1">Terlapor</legend>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-gray-500">Nama</p>
                <input type="text" value={namaTerlapor} onChange={(e) => setNamaTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">NRP</p>
                <input type="text" value={nrpTerlapor} onChange={(e) => setNrpTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Jabatan</p>
                <input type="text" value={jabatanTerlapor} onChange={(e) => setJabatanTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Kesatuan</p>
                <input type="text" value={kesatuanTerlapor} onChange={(e) => setKesatuanTerlapor(e.target.value)}
                  className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
              </div>
            </div>
          </fieldset>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">Dokumen Pendukung</p>
            <DocEntryList
              entries={docEntries}
              onChange={setDocEntries}
              docTypes={REPORT_DOC_TYPES}
              unit={unitLabel}
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : null}
            Simpan & Kirim ke Kabid
          </button>
        </div>
      </div>
    </div>
  )
}
