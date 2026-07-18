"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Play, Send, Copy, Check, Save, RotateCcw, Paperclip } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocEntryList, type DocEntry } from "./doc-template-input"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"
import { buildNomor } from "@/lib/template-nomor"
import { DateInput } from "@/components/ui/date-input"
import SearchableSelect from "@/components/ui/searchable-select"
import { Plus, Trash2 } from "lucide-react"

interface PelanggarItem {
  key: string
  prepetrator_id: string
  prepetrator_type: string
  prepetrator_description: string
  nama: string
  pangkat: string
  nrp: string
  jabatan: string
  kesatuan: string
  functional: string
  tempat_lahir: string
  tanggal_lahir: string
  telpon: string
  pendidikan: string
  jenis_kelamin: string
  wujud: string
  kategori: string
  sub_kategori: string
  pasal_disiplin: string[]
  pasal_kke: string[]
}

interface CatalogOptions {
  value: string
  label: string
  category?: string
  sub_category?: string
}

const BASE_TABS = [
  { key: "proses_lidik", label: "Proses Lidik" },
  { key: "pelaporan", label: "Pelaporan" },
  { key: "tindak_lanjut", label: "Tindak Lanjut" },
  { key: "rekap", label: "Rekap" },
]

const STAGES = [
  { value: "perencanaan", label: "Perencanaan" },
  { value: "pengumpulan", label: "Pengumpulan BAKET" },
  { value: "pengolahan", label: "Pengolahan" },
  { value: "pelaporan", label: "Pelaporan" },
]

const STAGE_DOC_TYPES: Record<string, { value: string; label: string }[]> = {
  perencanaan: [
    { value: "pemberitahuan_awal", label: "Pemberitahuan Awal" },
    { value: "uuk", label: "UUK" },
    { value: "sprinlidik", label: "Sprinlidik" },
  ],
  pengumpulan: [],
  pengolahan: [
    { value: "notulen_gelar", label: "Notulen Gelar" },
  ],
  pelaporan: [
    { value: "lhp", label: "LHP" },
    { value: "nota_dinas", label: "Nota Dinas" },
  ],
}

type DocBlock = { tanggal: string; nomor: string; files: File[]; uploadedFiles: { url: string; file_name: string }[]; saving: boolean; saved: boolean }
const emptyBlock = (): DocBlock => ({ tanggal: "", nomor: "", files: [], uploadedFiles: [], saving: false, saved: false })

function validateTelpon(telpon: string): { valid: boolean; warning: string } {
  if (!telpon) return { valid: true, warning: "" }
  const clean = telpon.replace(/\D/g, "")
  if (clean.length < 10) return { valid: false, warning: "No. HP minimal 10 digit" }
  if (!clean.startsWith("0") && !clean.startsWith("62")) return { valid: false, warning: "No. HP harus diawali 0 atau 62" }
  return { valid: true, warning: "" }
}

function validateNrp(nrp: string, tglLahir: string): { valid: boolean; warning: string } {
  if (!nrp) return { valid: true, warning: "" }
  const clean = nrp.replace(/\D/g, "")
  if (clean.length === 8) {
    const yy = parseInt(clean.slice(0, 2))
    const mm = parseInt(clean.slice(2, 4))
    if (mm < 1 || mm > 12) return { valid: false, warning: `NRP tidak valid: bulan ${mm} tidak ada (harus 01-12)` }
    if (tglLahir) {
      const d = new Date(tglLahir)
      if (!isNaN(d.getTime())) {
        const expectedYY = String(d.getFullYear()).slice(2)
        const expectedMM = String(d.getMonth() + 1).padStart(2, "0")
        if (clean.slice(0, 4) !== expectedYY + expectedMM) {
          const birthYear = d.getFullYear()
          const now = new Date().getFullYear()
          const age = now - birthYear
          if (age > 58) return { valid: false, warning: `Peringatan: usia ${age} tahun — sudah melewati batas pensiun (58 tahun)` }
          if (age < 18) return { valid: false, warning: `Peringatan: usia ${age} tahun — terlalu muda` }
          return { valid: false, warning: `NRP (${clean}) tidak sesuai tanggal lahir — seharusnya ${expectedYY}${expectedMM}XXXX` }
        }
      }
    }
    return { valid: true, warning: "" }
  }
  if (clean.length >= 16) {
    const y = parseInt(clean.slice(0, 4))
    const m = parseInt(clean.slice(4, 6))
    const d = parseInt(clean.slice(6, 8))
    if (m < 1 || m > 12) return { valid: false, warning: `NIP tidak valid: bulan ${m} tidak ada (harus 01-12)` }
    if (d < 1 || d > 31) return { valid: false, warning: `NIP tidak valid: tanggal ${d} tidak ada (harus 01-31)` }
    if (tglLahir && clean.length === 18) {
      const bd = new Date(tglLahir)
      if (!isNaN(bd.getTime())) {
        const ey = bd.getFullYear().toString()
        const em = String(bd.getMonth() + 1).padStart(2, "0")
        const ed = String(bd.getDate()).padStart(2, "0")
        if (clean.slice(0, 8) !== ey + em + ed) {
          return { valid: false, warning: `NIP tidak sesuai tanggal lahir — seharusnya ${ey}${em}${ed}XXXXXXXXXX` }
        }
      }
    }
    return { valid: true, warning: "" }
  }
  if (clean.length > 0) {
    return { valid: false, warning: `NRP/NIP harus 8 digit (Polri) atau 16/18 digit (PNS)` }
  }
  return { valid: true, warning: "" }
}

const PANGKAT_LIST = [
  "KOMBES POL", "AKBP", "KOMPOL", "AKP", "IPTU", "IPDA",
  "AIPTU", "AIPDA", "BRIPKA", "BRIGADIR", "BRIPTU", "BRIPDA",
  "ABRIP", "ABRIPTU", "ABRIPDA", "BHARAKA", "BHARATU", "BHARADA",
  "PENATA TK I", "PENATA", "PENATA MUDA TK I", "PENATA MUDA",
  "PENGATUR TK I", "PENGATUR", "PENGATUR MUDA TK I", "PENGATUR MUDA",
  "JURU TK I", "JURU", "JURU MUDA TK I", "JURU MUDA",
]

const TINDAK_LANJUT = [  { key: "pem_pelapor", label: "Pemberitahuan ke Pelapor" },
  { key: "pem_ankum", label: "Pemberitahuan ke Ankum" },
]

const SYARAT_MATERIIL = [
  { key: "tidak_keresahan", label: "Tidak menimbulkan keresahan dan penolakan dari masyarakat" },
  { key: "tidak_konflik", label: "Tidak berdampak konflik sosial" },
  { key: "pernyataan_tidak_keberatan", label: "Adanya pernyataan dari semua pihak untuk tidak keberatan" },
  { key: "prinsip_pembatas", label: "Memenuhi kriteria Prinsip pembatas" },
]

const SYARAT_PEMBATAS = [
  { key: "kesalahan_ringan", label: "Tingkat kesalahan pelaku tidak berat (Mensrea)" },
  { key: "bukan_berulang", label: "Pelaku bukan anggota yang sering melakukan pelanggaran" },
]

const SYARAT_FORMIL = [
  { key: "surat_permohonan", label: "Surat Permohonan Perdamaian dari kedua belah pihak" },
  { key: "surat_pernyataan", label: "Surat Pernyataan Perdamaian kedua belah pihak" },
  { key: "surat_pencabutan", label: "Surat Pencabutan Laporan oleh pelapor di atas meterai" },
  { key: "ba_pemeriksaan", label: "Berita acara pemeriksaan tambahan terhadap kedua belah pihak" },
]

export default function AksiPaminal({
  pengaduanId,
  prepetratorId,
  pengaduan,
  config,
  unitOptions,
  isLocked: isLockedProp,
}: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = false
  const isLocked = isLockedProp ?? (currentPosition
    ? !/PAMINAL/i.test(currentPosition)
    : false)

  const now = new Date()
  const nowM = now.getMonth() + 1
  const nowY = now.getFullYear()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [skipGajamada, setSkipGajamada] = useState(false)
  const [activeTab, setActiveTab] = useState("proses_lidik")
  const stage = activeTab === "pelaporan" ? "pelaporan" : "perencanaan"
  const [docEntries, setDocEntries] = useState<DocEntry[]>([
    { key: crypto.randomUUID(), doc_type: "", nomor_urut: "", bulan: nowM, tahun: nowY },
  ])

  // Proses Lidik — 4 blok dokumen
  const [pemberitahuanAwal, setPemberitahuanAwal] = useState<DocBlock>(emptyBlock())
  const [uuk, setUuk] = useState<DocBlock>(emptyBlock())
  const [sprin, setSprin] = useState<DocBlock>(emptyBlock())
  const [lhp, setLhp] = useState<DocBlock>(emptyBlock())
  const [nodin, setNodin] = useState<DocBlock>(emptyBlock())
  const [tlPelimpahanBlock, setTlPelimpahanBlock] = useState<DocBlock>(emptyBlock())
  const [tlSprinBlock, setTlSprinBlock] = useState<DocBlock>(emptyBlock())
  const [tlAnkumBlock, setTlAnkumBlock] = useState<DocBlock>(emptyBlock())
  const [tlPelaporBlock, setTlPelaporBlock] = useState<DocBlock>(emptyBlock())
  const [tlMabesBlock, setTlMabesBlock] = useState<DocBlock>(emptyBlock())
  const [tlJukrahBlock, setTlJukrahBlock] = useState<DocBlock>(emptyBlock())
  const [tlSatkerTujuan, setTlSatkerTujuan] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [hasil, setHasil] = useState(() => {
    const up = pengaduan.unit_progress ?? ""
    if (up.includes("terbukti")) return "terbukti"
    if (up.includes("tidak_terbukti")) return "tidak_terbukti"
    if (up.includes("perdamaian")) return "perdamaian"
    return ""
  })
  const [pelimpahan, setPelimpahan] = useState(() => {
    const up = pengaduan.unit_progress ?? ""
    const m = up.match(/Limpah ke:\s*(\w+)/)
    return m ? m[1] : ""
  })
  const [gelarBlock, setGelarBlock] = useState<DocBlock>(emptyBlock())
  const [pelanggarList, setPelanggarList] = useState<PelanggarItem[]>([])
  const [catalogWujud, setCatalogWujud] = useState<{ value: string; label: string; kategori: string; sub_kategori: string }[]>([])
  const [catalogPasal, setCatalogPasal] = useState<{ value: string; label: string; type?: string }[]>([])
  const [catalogKesatuan, setCatalogKesatuan] = useState<{ value: string; label: string }[]>([])

  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(json => {
        if (json.error) { console.error("Settings error:", json.error); return }
        const row = (json.data ?? []).find((r: any) => r.key === "doc_templates")
        if (row?.value) { try { setCustomTemplates(row.value) } catch {} }
      })
      .catch(e => console.error("Fetch settings error:", e))
  }, [])

  useEffect(() => {
    fetch("/api/catalog").then(r => r.json()).then(json => {
      if (json.success) {
        setCatalogWujud(json.data.wujud ?? [])
        setCatalogPasal(json.data.pasal ?? [])
        setCatalogKesatuan(json.data.kesatuan ?? [])
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/bukti?pengaduanId=${pengaduanId}`)
      .then(r => r.json())
      .then(json => {
        const list = (json.data ?? []) as { url: string; file_name: string; doc_type: string | null }[]
        const byDoc: Record<string, { url: string; file_name: string }[]> = {}
        list.forEach(a => {
          const dt = a.doc_type ?? "unknown"
          if (!byDoc[dt]) byDoc[dt] = []
          byDoc[dt].push({ url: a.url, file_name: a.file_name })
        })
        if (byDoc["pemberitahuan_awal"]) setPemberitahuanAwal(p => ({ ...p, uploadedFiles: byDoc["pemberitahuan_awal"] }))
        if (byDoc["uuk"]) setUuk(p => ({ ...p, uploadedFiles: byDoc["uuk"] }))
        if (byDoc["sprinlidik"]) setSprin(p => ({ ...p, uploadedFiles: byDoc["sprinlidik"] }))
        if (byDoc["lhp"]) setLhp(p => ({ ...p, uploadedFiles: byDoc["lhp"] }))
        if (byDoc["nota_dinas"]) setNodin(p => ({ ...p, uploadedFiles: byDoc["nota_dinas"] }))
      })
      .catch(() => {})
  }, [pengaduanId])
  const [tlList, setTlList] = useState<{ key: string; label: string; checked: boolean; nomor: string }[]>(
    TINDAK_LANJUT.map(tl => ({ ...tl, checked: false, nomor: "" }))
  )

  const [perdamaianMateriil, setPerdamaianMateriil] = useState<Record<string, boolean>>({})
  const [perdamaianPembatas, setPerdamaianPembatas] = useState<Record<string, boolean>>({})
  const [perdamaianFormil, setPerdamaianFormil] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const router = useRouter()

  const TABS = hasil === "terbukti"
    ? [...BASE_TABS.slice(0, 2), { key: "terbukti", label: "Pelanggar" }, ...BASE_TABS.slice(2)]
    : BASE_TABS

  const title = (config?.title as string) ?? "Proses Paminal"
  const docTypes = STAGE_DOC_TYPES[stage] ?? []

  function toggleTl(idx: number) {
    const next = [...tlList]
    next[idx].checked = !next[idx].checked
    setTlList(next)
  }

  function setTlNomor(idx: number, nomor: string) {
    const next = [...tlList]
    next[idx].nomor = nomor
    setTlList(next)
  }

  async function salinRekap() {
    const lines = tlList
      .filter(tl => tl.checked)
      .map(tl => `${tl.label} — No: ${tl.nomor || "-"}`)
    const text = `Tindak Lanjut Wajib:\n${lines.join("\n")}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  function handleTanggal(
    setter: React.Dispatch<React.SetStateAction<DocBlock>>,
    val: string,
    docType: string,
  ) {
    const autoFillDocTypes = ["pemberitahuan_awal", "uuk", "sprinlidik", "notulen_gelar", "lhp", "nota_dinas"]
    
    setter(prev => {
      let nextNomor = prev.nomor
      if (val && autoFillDocTypes.includes(docType)) {
        const d = new Date(val + "T00:00:00")
        const generated = buildNomor(docType, "     ", d.getMonth() + 1, d.getFullYear(), "Subbid Paminal", customTemplates)
        
        if (!prev.nomor) {
          nextNomor = generated
        } else {
          // Check DOC_TEMPLATES first for default fallback since we don't have direct access here cleanly
          // but we do have DOC_TEMPLATES imported
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

  async function simpanDok(
    docType: string,
    block: DocBlock,
    setter: React.Dispatch<React.SetStateAction<DocBlock>>
  ) {
    if (isLocked) return
    if (!block.tanggal || !block.nomor) return
    
    setter(p => ({ ...p, saving: true }))
    try {
      const payload = {
        action: "upload_only",
        pengaduanId,
        prepetratorId,
        dokumen: [{ doc_type: docType, nomor: block.nomor, tanggal: block.tanggal }],
      }

      let res
      if (block.files.length > 0) {
        const fd = new FormData()
        fd.append("data", JSON.stringify(payload))
        block.files.forEach(f => fd.append("files", f))
        res = await fetch("/api/unit", { method: "POST", body: fd })
      } else {
        res = await fetch("/api/unit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      const uploaded = (json.attachments ?? []) as { url: string; file_name: string }[]

      setter(p => ({
        ...p,
        saving: false,
        saved: true,
        files: [],
        uploadedFiles: [...p.uploadedFiles, ...uploaded],
      }))
      window.dispatchEvent(new CustomEvent("e-propam:file-uploaded"))
      setTimeout(() => setter(p => ({ ...p, saved: false })), 2000)
      router.refresh()
    } catch {
      setter(p => ({ ...p, saving: false }))
    }
  }

  async function handleUpdateStatusLidik() {
    setUpdatingStatus(true)
    try {
      await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mulai",
          pengaduanId,
          prepetratorId,
          currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          skip_gajamada: skipGajamada,
        }),
      })
      router.refresh()
    } catch {}
    finally { setUpdatingStatus(false) }
  }
  async function handleSavePelanggar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_pelanggar",
          pengaduanId,
          prepetratorId,
          skip_gajamada: skipGajamada,
          pelanggar_list: pelanggarList,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }
  async function handleStageUpdate() {
    if (stage === "pelaporan" && hasil === "terbukti") {
      const invalid: string[] = []
      pelanggarList.forEach((p, i) => {
        const required: { field: string; val: string }[] = [
          { field: "Nama", val: p.nama }, { field: "Pangkat", val: p.pangkat }, { field: "NRP", val: p.nrp }, { field: "Wujud Perbuatan", val: p.wujud },
        ]
        // Skip validation if only 1 pelanggar and no required fields are filled yet
        if (pelanggarList.length === 1) {
          const anyFilled = required.some(r => r.val.trim())
          if (!anyFilled) return
        }
        required.forEach(r => { if (!r.val.trim()) invalid.push(`Pelanggar ${i+1}: ${r.field} wajib diisi`) })
        if (p.nrp) {
          const v = validateNrp(p.nrp, p.tanggal_lahir)
          if (v.warning && !v.valid) invalid.push(`Pelanggar ${i+1}: ${v.warning}`)
        }
        if (!p.pasal_disiplin.length && !p.pasal_kke.length) invalid.push(`Pelanggar ${i+1}: minimal satu pasal wajib dipilih`)
      })
      if (invalid.length > 0) { setError(invalid.join("; ")); setLoading(false); return }
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: stage === "pelaporan" ? "pelaporan" : "update_stage",
          pengaduanId,
          prepetratorId,
          currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          stage,
          dokumen: [], // dokumen dikirim lewat simpanDok masing-masing
          hasil: stage === "pelaporan" ? hasil : undefined,
          terbukti: stage === "pelaporan" ? hasil === "terbukti" : undefined,
          gelar_tanggal: stage === "pelaporan" ? gelarBlock.tanggal : undefined,
          gelar_notulen: stage === "pelaporan" ? gelarBlock.nomor : undefined,
          pelimpahan: stage === "pelaporan" && hasil === "terbukti" ? pelimpahan : undefined,
          pelanggar_list: stage === "pelaporan" && hasil === "terbukti" ? pelanggarList : undefined,
          perdamaian_materiil: stage === "pelaporan" && hasil === "perdamaian" ? perdamaianMateriil : undefined,
          perdamaian_pembatas: stage === "pelaporan" && hasil === "perdamaian" ? perdamaianPembatas : undefined,
          perdamaian_formil: stage === "pelaporan" && hasil === "perdamaian" ? perdamaianFormil : undefined,
          tindak_lanjut: stage === "pelaporan" ? tlList : undefined,
          skip_gajamada: skipGajamada,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  function renderDocBlock(
    title: string,
    docType: string,
    block: DocBlock,
    setter: React.Dispatch<React.SetStateAction<DocBlock>>
  ) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-gray-300">{title}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <p className="text-[11px] text-gray-500 mb-0.5">Tanggal</p>
            <DateInput value={block.tanggal} onChange={val => handleTanggal(setter, val, docType)}
              className="text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 mb-0.5">Nomor Lengkap</p>
            <input type="text" value={block.nomor}
              onChange={e => setter(p => ({ ...p, nomor: e.target.value }))}
              placeholder="Isi nomor lengkap..."
              className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
          <button onClick={() => simpanDok(docType, block, setter)} disabled={isLocked || block.saving || !block.tanggal || !block.nomor}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
            {block.saving ? <Loader2 className="w-3 h-3 animate-spin" /> : block.saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
            {block.saved ? "Tersimpan" : "Simpan"}
          </button>
          <button onClick={() => setter(p => ({ ...p, tanggal: "", nomor: "", saving: false, saved: false }))} className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <label className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded cursor-pointer">
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
            <p className="text-[11px] text-gray-400 mb-1">File Terlampir:</p>
            <ul className="space-y-0.5">
              {block.uploadedFiles.map((f, i) => (
                <li key={`up-${i}`} className="flex items-center justify-between text-xs text-gray-200">
                  <span className="truncate text-green-400">{f.file_name}</span>
                </li>
              ))}
              {block.files.map((f, i) => (
                <li key={`new-${i}`} className="flex items-center justify-between text-xs text-gray-200">
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



  return (
    <AksiCard title={title} variant="default">
      <div className="space-y-2">
        {isLocked && (
          <div className="text-[11px] text-amber-300 bg-amber-900/20 border border-amber-700 rounded px-2 py-1">
            Kasus sudah diserah-terimakan ke <strong>{currentPosition ?? "unit lain"}</strong>.
            Dokumentasi tetap terlihat, namun tombol Simpan dinonaktifkan.
          </div>
        )}
        {(unitStatus === "dalam_proses" || !unitStatus || unitStatus === "pelaporan_selesai") && !isDone && (
          <div className="space-y-2">
            {/* Tab Bar */}
            <div className="flex gap-0 border-b border-gray-700 -mx-2 px-2">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? "text-white border-blue-400 bg-blue-900/20"
                      : "text-gray-400 border-transparent hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Proses Lidik */}
            {activeTab === "proses_lidik" && (
              <div className="space-y-3">

                {renderDocBlock("Pemberitahuan Awal", "pemberitahuan_awal", pemberitahuanAwal, setPemberitahuanAwal)}
                <hr className="border-gray-700" />
                {renderDocBlock("UUK", "uuk", uuk, setUuk)}
                <hr className="border-gray-700" />
                {renderDocBlock("Sprin Lidik", "sprinlidik", sprin, setSprin)}
                <hr className="border-gray-700" />

                <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
                  <input type="checkbox" checked={skipGajamada} onChange={e => setSkipGajamada(e.target.checked)}
                    className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                  Jangan update timeline Gajamada
                </label>
                <button onClick={handleUpdateStatusLidik} disabled={isLocked || updatingStatus}
                  className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded disabled:opacity-40">
                  {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Update Status → PROSES LIDIK
                </button>

              </div>
            )}

            {/* Tab: Pelaporan */}
            {activeTab === "pelaporan" && (
              <div className="space-y-3">
                {renderDocBlock("Gelar Perkara", "notulen_gelar", gelarBlock, setGelarBlock)}
                <hr className="border-gray-700" />

                {renderDocBlock("LHP", "lhp", lhp, setLhp)}
                <hr className="border-gray-700" />
                {renderDocBlock("Nota Dinas", "nota_dinas", nodin, setNodin)}
                <hr className="border-gray-700" />

                {/* Hasil Akhir */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-green-400 mb-1">Hasil Lidik</p>
                  <Select value={hasil} onValueChange={(v) => { setHasil(v ?? ""); if (v !== "terbukti") setPelimpahan("") }}>
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
                  <input type="checkbox" checked={skipGajamada} onChange={e => setSkipGajamada(e.target.checked)}
                    className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                  Jangan update timeline Gajamada
                </label>
                <button onClick={handleStageUpdate} disabled={isLocked || loading || !hasil}
                  className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Update Status → {hasil === "terbukti" ? "LAPORAN SELESAI" : hasil === "perdamaian" ? "RESTORATIVE JUSTICE" : hasil === "tidak_terbukti" ? "TIDAK TERBUKTI" : "Pilih Hasil"}
                </button>

              </div>
            )}

            {/* Tab: Pelanggar (muncul jika hasil=terbukti) */}
            {activeTab === "terbukti" && (
              <div className="space-y-2">
                {(pelanggarList.length === 0 ? [{ key: crypto.randomUUID(), prepetrator_id: "", prepetrator_type: "Polri", prepetrator_description: "", nama: "", pangkat: "", nrp: "", jabatan: "", kesatuan: "POLDA JAWA BARAT", functional: "", tempat_lahir: "", tanggal_lahir: "", telpon: "", pendidikan: "", jenis_kelamin: "laki-laki", wujud: "", kategori: "", sub_kategori: "", pasal_disiplin: [] as string[], pasal_kke: [] as string[] }] as PelanggarItem[] : pelanggarList).map((p, idx) => {
                  const realIdx = pelanggarList.findIndex(x => x.key === p.key)
                  const defaultItem: PelanggarItem = { key: crypto.randomUUID(), prepetrator_id: "", prepetrator_type: "Polri", prepetrator_description: "", nama: "", pangkat: "", nrp: "", jabatan: "", kesatuan: "POLDA JAWA BARAT", functional: "", tempat_lahir: "", tanggal_lahir: "", telpon: "", pendidikan: "", jenis_kelamin: "laki-laki", wujud: "", kategori: "", sub_kategori: "", pasal_disiplin: [], pasal_kke: [] }
                  const updater = (up: Partial<PelanggarItem>) => {
                    if (pelanggarList.length === 0) {
                      setPelanggarList([{ ...defaultItem, ...up }])
                    } else {
                      const next = [...pelanggarList]
                      next[realIdx >= 0 ? realIdx : 0] = { ...next[realIdx >= 0 ? realIdx : 0], ...up }
                      setPelanggarList(next)
                    }
                  }
                  return (
                    <div key={p.key} className="bg-[#1E293B] border border-gray-600 rounded p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-yellow-400">Pelanggar {realIdx >= 0 ? realIdx + 1 : 1}</p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPelanggarList(prev => [...prev, { key: crypto.randomUUID(), prepetrator_id: "", prepetrator_type: "Polri", prepetrator_description: "", nama: "", pangkat: "", nrp: "", jabatan: "", kesatuan: "POLDA JAWA BARAT", functional: "", tempat_lahir: "", tanggal_lahir: "", telpon: "", pendidikan: "", jenis_kelamin: "laki-laki", wujud: "", kategori: "", sub_kategori: "", pasal_disiplin: [], pasal_kke: [] }])}
                            className="text-[11px] text-blue-400 hover:text-blue-300">+ Tambah</button>
                          {pelanggarList.length > 1 && (
                            <button onClick={() => setPelanggarList(prev => prev.filter(x => x.key !== p.key))}
                              className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[11px] text-gray-500">Nama <span className="text-red-400">*</span></p>
                          <input type="text" value={p.nama} onChange={e => updater({ nama: e.target.value })} maxLength={100} className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Pangkat <span className="text-red-400">*</span></p>
                          <select value={p.pangkat} onChange={e => updater({ pangkat: e.target.value })} className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                            <option value="">--</option>
                            {PANGKAT_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[11px] text-gray-500">NRP / NIP <span className="text-red-400">*</span></p>
                          <input type="text" value={p.nrp} onChange={e => {
                            const val = e.target.value.replace(/\D/g, "")
                            const up: Partial<PelanggarItem> = { nrp: val }
                            if (val.length >= 4) {
                              const clean = val
                              if (clean.length === 8) {
                                const yy = parseInt(clean.slice(0, 2))
                                const mm = parseInt(clean.slice(2, 4))
                                if (mm >= 1 && mm <= 12) {
                                  const year = yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy
                                  up.tanggal_lahir = `${year}-${String(mm).padStart(2,"0")}-01`
                                }
                              } else if (clean.length === 16 || clean.length === 18) {
                                const y = clean.slice(0, 4)
                                const m = clean.slice(4, 6)
                                const d = clean.slice(6, 8)
                                up.tanggal_lahir = `${y}-${m}-${d}`
                              }
                            }
                            updater(up)
                          }} maxLength={18}
                            placeholder="Polri: 8 digit (YYMM+urut) | PNS: 16/18 digit"
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-500" />
                          {(() => { const v = validateNrp(p.nrp, p.tanggal_lahir); return v.warning ? <p className={v.valid ? "text-[9px] text-yellow-400 mt-0.5" : "text-[9px] text-red-400 mt-0.5"}>{v.warning}</p> : null })()}
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Tanggal Lahir</p>
                          <DateInput value={p.tanggal_lahir} onChange={val => updater({ tanggal_lahir: val })}
                            className="text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[11px] text-gray-500">Tempat Lahir</p>
                          <input type="text" value={p.tempat_lahir} onChange={e => updater({ tempat_lahir: e.target.value })}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">No. Telepon</p>
                          <input type="text" value={p.telpon} onChange={e => updater({ telpon: e.target.value.replace(/\D/g, "") })} maxLength={15}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
                          {(() => { const v = validateTelpon(p.telpon); return v.warning ? <p className="text-[9px] text-red-400 mt-0.5">{v.warning}</p> : null })()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[11px] text-gray-500">Pendidikan</p>
                          <select value={p.pendidikan} onChange={e => updater({ pendidikan: e.target.value })}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                            <option value="">--</option>
                            <option value="AKPOL">AKPOL</option>
                            <option value="SIPSS">SIPSS</option>
                            <option value="BINTARA">BINTARA</option>
                            <option value="TAMTAMA">TAMTAMA</option>
                            <option value="SIP">SIP</option>
                            <option value="PAG">PAG</option>
                            <option value="SEKOLAH BINTARA POLISI">SEKOLAH BINTARA POLISI</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Jenis Kelamin</p>
                          <select value={p.jenis_kelamin} onChange={e => updater({ jenis_kelamin: e.target.value })}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                            <option value="">--</option>
                            <option value="laki-laki">Laki-laki</option>
                            <option value="perempuan">Perempuan</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[11px] text-gray-500">Jabatan</p>
                          <input type="text" value={p.jabatan} onChange={e => updater({ jabatan: e.target.value })} maxLength={100} className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Kesatuan</p>
                          <input type="text" value="POLDA JAWA BARAT" disabled className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-400 rounded px-1.5 h-8" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[11px] text-gray-500">Jenis Personel <span className="text-red-400">*</span></p>
                          <select value={p.prepetrator_type} onChange={e => updater({ prepetrator_type: e.target.value })}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                            <option value="">--</option>
                            <option value="Anggota Polri">Anggota Polri</option>
                            <option value="Polri">Polri</option>
                            <option value="PNS">PNS</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500">Sub Fungsi <span className="text-red-400">*</span></p>
                          <select value={p.functional} onChange={e => updater({ functional: e.target.value })}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                            <option value="">--</option>
                            {catalogWujud.map(w => <option key={w.value} value={w.value}>{w.value}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500">Keterangan Tambahan</p>
                        <textarea value={p.prepetrator_description} onChange={e => updater({ prepetrator_description: e.target.value })}
                          placeholder="Keterangan tambahan (opsional)..."
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 py-1 min-h-[30px] placeholder:text-gray-500" />
                      </div>

                      <div className="border-t border-gray-600 pt-1.5">
                        <p className="text-[11px] text-gray-500 mb-0.5">Wujud Perbuatan <span className="text-red-400">*</span></p>
                        <SearchableSelect
                          options={catalogWujud.map(w => ({ value: w.value, label: w.value }))}
                          value={p.wujud}
                          onChange={val => {
                            const found = catalogWujud.find(w => w.value === val)
                            updater({ wujud: val, kategori: found?.kategori ?? "", sub_kategori: found?.sub_kategori ?? "" })
                          }}
                          placeholder="Cari wujud perbuatan..."
                        />
                        {p.kategori && (
                          <div className="text-[11px] text-gray-400 mt-1">
                            Kategori: <span className="text-blue-300">{p.kategori}</span> → Sub: <span className="text-blue-300">{p.sub_kategori}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-0.5">Pasal Disiplin <span className="text-red-400">*</span></p>
                        <div className="space-y-1">
                          {p.pasal_disiplin.map((pv, pi) => (
                            <div key={pi} className="flex items-center gap-1">
                              <span className="text-[11px] text-blue-300 flex-1">{pv}</span>
                              <button onClick={() => updater({ pasal_disiplin: p.pasal_disiplin.filter((_, i) => i !== pi) })}
                                className="text-red-400 hover:text-red-300 text-[11px]">✕</button>
                            </div>
                          ))}
                          <select value="" onChange={e => {
                            if (e.target.value && !p.pasal_disiplin.includes(e.target.value)) {
                              updater({ pasal_disiplin: [...p.pasal_disiplin, e.target.value] })
                            }
                          }} className="w-full text-[11px] bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-7">
                            <option value="">+ Tambah pasal disiplin...</option>
                            {(() => { const seen = new Set<string>(); return catalogPasal.filter(c => c.type && /PPRI/i.test(c.type)).filter(c => { if (seen.has(c.value)) return false; seen.add(c.value); return true }).map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            )) })()}
                          </select>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-0.5">Pasal Kode Etik (KKE) <span className="text-red-400">*</span></p>
                        <div className="space-y-1">
                          {p.pasal_kke.map((pv, pi) => (
                            <div key={pi} className="flex items-center gap-1">
                              <span className="text-[11px] text-purple-300 flex-1">{pv}</span>
                              <button onClick={() => updater({ pasal_kke: p.pasal_kke.filter((_, i) => i !== pi) })}
                                className="text-red-400 hover:text-red-300 text-[11px]">✕</button>
                            </div>
                          ))}
                          <select value="" onChange={e => {
                            if (e.target.value && !p.pasal_kke.includes(e.target.value)) {
                              updater({ pasal_kke: [...p.pasal_kke, e.target.value] })
                            }
                          }} className="w-full text-[11px] bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-7">
                            <option value="">+ Tambah pasal KKE...</option>
                            {(() => { const seen = new Set<string>(); return catalogPasal.filter(c => c.type && /PERPOL/i.test(c.type)).filter(c => { if (seen.has(c.value)) return false; seen.add(c.value); return true }).map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            )) })()}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center gap-1.5 pt-1 border-t border-gray-600">
                  <button onClick={handleSavePelanggar} disabled={isLocked || loading}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Simpan ke Gajamada
                  </button>
                  <button onClick={() => { if (confirm("Reset semua data terduga pelanggar?")) setPelanggarList([]) }}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 border border-gray-600 text-gray-300 rounded hover:text-white">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                  {error && <p className="text-[10px] text-red-400 flex-1">{error}</p>}
                  {success && <p className="text-[10px] text-green-400 flex-1">{success}</p>}
                </div>
              </div>
            )}

            {/* Tab: Tindak Lanjut */}
            {activeTab === "tindak_lanjut" && (
              <div className="space-y-3">
                {hasil === "terbukti" && (
                  <>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-yellow-400">Pelimpahan</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[11px] text-gray-500 mb-0.5">Tanggal</p>
                          <DateInput value={tlPelimpahanBlock.tanggal} onChange={val => setTlPelimpahanBlock(p => ({ ...p, tanggal: val }))}
                            className="text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8" />
                        </div>
                        <div>
                          <p className="text-[11px] text-gray-500 mb-0.5">Nomor</p>
                          <input type="text" value={tlPelimpahanBlock.nomor} onChange={e => setTlPelimpahanBlock(p => ({ ...p, nomor: e.target.value }))}
                            placeholder="Nomor pelimpahan..."
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8 placeholder:text-gray-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-500 mb-0.5">Satker Tujuan</p>
                        <select value={tlSatkerTujuan} onChange={e => setTlSatkerTujuan(e.target.value)}
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-8">
                          <option value="">Pilih...</option>
                          {unitOptions.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button onClick={() => simpanDok("nota_dinas", tlPelimpahanBlock, setTlPelimpahanBlock)} disabled={isLocked || tlPelimpahanBlock.saving || !tlPelimpahanBlock.tanggal || !tlPelimpahanBlock.nomor}
                          className="flex items-center gap-1 text-xs px-2 py-1 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded disabled:opacity-40">
                          {tlPelimpahanBlock.saving ? <Loader2 className="w-3 h-3 animate-spin" /> : tlPelimpahanBlock.saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                          {tlPelimpahanBlock.saved ? "Tersimpan" : "Simpan"}
                        </button>
                        <button onClick={() => setTlPelimpahanBlock(emptyBlock())} className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded">
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                        <label className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-600 text-gray-400 hover:text-white rounded cursor-pointer">
                          <Paperclip className="w-3 h-3" /> Upload
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={e => {
                            if (e.target.files) setTlPelimpahanBlock(p => ({ ...p, files: [...p.files, ...Array.from(e.target.files)] }))
                          }} />
                        </label>
                      </div>
                    </div>
                    <hr className="border-gray-700" />
                  </>
                )}
                {hasil === "tidak_terbukti" && (
                  <>
                    {renderDocBlock("Sprin Henti Lidik", "sprinlidik", tlSprinBlock, setTlSprinBlock)}
                    <hr className="border-gray-700" />
                    {renderDocBlock("Pemberitahuan ke Ankum", "nota_dinas", tlAnkumBlock, setTlAnkumBlock)}
                    <hr className="border-gray-700" />
                  </>
                )}
                {renderDocBlock("Pemberitahuan Kepada Pelapor (SP2HP2)", "pemberitahuan_awal", tlPelaporBlock, setTlPelaporBlock)}
                <hr className="border-gray-700" />
                {renderDocBlock("Surat ke Mabes Polri", "nota_dinas", tlMabesBlock, setTlMabesBlock)}
                <hr className="border-gray-700" />
                {renderDocBlock("STR Jukrah", "nota_dinas", tlJukrahBlock, setTlJukrahBlock)}
              </div>
            )}

            {/* Tab: Rekap */}
            {activeTab === "rekap" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 mb-1">Ringkasan</p>
                <div className="text-xs text-gray-300 space-y-1">
                  <p><span className="text-gray-500">Tahap:</span> {STAGES.find(s => s.value === stage)?.label}</p>
                  {gelarBlock.tanggal && (
                    <p><span className="text-gray-500">Gelar:</span> {gelarBlock.tanggal}</p>
                  )}
                  {gelarBlock.nomor && (
                    <p><span className="text-gray-500">Notulen:</span> {gelarBlock.nomor}</p>
                  )}
                  {hasil && (
                    <p><span className="text-gray-500">Hasil:</span> {hasil === "terbukti" ? "Terbukti" : hasil === "perdamaian" ? "Perdamaian" : "Tidak Terbukti"}</p>
                  )}
                  {tlList.filter(t => t.checked).length > 0 && (
                    <p>
                      <span className="text-gray-500">Tindak Lanjut:</span>{" "}
                      {tlList.filter(t => t.checked).map(t => t.label).join(", ")}
                    </p>
                  )}
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}
                {success && <p className="text-green-400 text-xs">{success}</p>}

                <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mb-1.5">
                  <input type="checkbox" checked={skipGajamada} onChange={e => setSkipGajamada(e.target.checked)}
                    className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]" />
                  Jangan update timeline Gajamada
                </label>
                <button
                  onClick={handleStageUpdate}
                  disabled={isLocked || loading}
                  className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Send className="w-3 h-3 mr-1 inline" />}
                  {stage === "pelaporan" ? "Selesai & Kirim" : "Update Progress"}
                </button>
              </div>
            )}
          </div>
        )}

        {isDone && (
          <div className="space-y-2">
            <p className="text-xs text-green-400 text-center">Proses sudah selesai</p>
            {pengaduan.unit_progress && (
              <p className="text-xs text-gray-400 text-center">{pengaduan.unit_progress}</p>
            )}
          </div>
        )}
      </div>
    </AksiCard>
  )
}





