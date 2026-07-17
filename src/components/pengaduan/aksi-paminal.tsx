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

const TABS = [
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

const TINDAK_LANJUT = [  { key: "pem_pelapor", label: "Pemberitahuan ke Pelapor" },
  { key: "pem_ankum", label: "Pemberitahuan ke Ankum" },
]

const WUJUD_PERBUATAN_LIST = [
  "Pungli", "Penyalahgunaan Wewenang", "Kekerasan", "Pelanggaran Disiplin", "Pelanggaran Kode Etik", "Tindak Pidana", "Lainnya"
]
const PASAL_LIST = [
  "Pasal 7 PP No.2 Tahun 2003", "Pasal 10 PP No.2 Tahun 2003", "Pasal 13 Perkap No.14 Tahun 2011", "Pasal 14 Perkap No.14 Tahun 2011", "Pasal 15 Perkap No.14 Tahun 2011"
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
}: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = unitStatus === "selesai"

  const now = new Date()
  const nowM = now.getMonth() + 1
  const nowY = now.getFullYear()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("proses_lidik")
  const stage = activeTab === "pelaporan" ? "pelaporan" : "perencanaan"
  const [catatan, setCatatan] = useState("")
  const [docEntries, setDocEntries] = useState<DocEntry[]>([
    { key: crypto.randomUUID(), doc_type: "", nomor_urut: "", bulan: nowM, tahun: nowY },
  ])

  // Proses Lidik — 4 blok dokumen
  const [pemberitahuanAwal, setPemberitahuanAwal] = useState<DocBlock>(emptyBlock())
  const [uuk, setUuk] = useState<DocBlock>(emptyBlock())
  const [sprin, setSprin] = useState<DocBlock>(emptyBlock())
  const [renbut, setRenbut] = useState<DocBlock>(emptyBlock())
  const [lhp, setLhp] = useState<DocBlock>(emptyBlock())
  const [nodin, setNodin] = useState<DocBlock>(emptyBlock())
  const [catatanLidik, setCatatanLidik] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const [hasil, setHasil] = useState("")
  const [pelimpahan, setPelimpahan] = useState("")
  const [gelarTanggal, setGelarTanggal] = useState("")
  const [gelarNotulen, setGelarNotulen] = useState("")
  const [autoNotulen, setAutoNotulen] = useState("")
  const [pelanggarNama, setPelanggarNama] = useState("")
  const [pelanggarNrp, setPelanggarNrp] = useState("")
  const [pelanggarJabatan, setPelanggarJabatan] = useState("")
  const [kategoriPelanggaran, setKategoriPelanggaran] = useState("")
  const [pelanggarPangkat, setPelanggarPangkat] = useState("")
  const [pelanggarKesatuan, setPelanggarKesatuan] = useState("")
  const [wujudPerbuatan, setWujudPerbuatan] = useState("")

  const [customTemplates, setCustomTemplates] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(json => {
        if (json.error) {
          console.error("Settings error:", json.error)
          return
        }
        const row = (json.data ?? []).find((r: any) => r.key === "doc_templates")
        if (row?.value) {
          try {
            setCustomTemplates(row.value)
          } catch {}
        }
      })
      .catch(e => console.error("Fetch settings error:", e))
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
        if (byDoc["renbut"]) setRenbut(p => ({ ...p, uploadedFiles: byDoc["renbut"] }))
        if (byDoc["lhp"]) setLhp(p => ({ ...p, uploadedFiles: byDoc["lhp"] }))
        if (byDoc["nota_dinas"]) setNodin(p => ({ ...p, uploadedFiles: byDoc["nota_dinas"] }))
      })
      .catch(() => {})
  }, [pengaduanId])
  const [pasalDilanggar, setPasalDilanggar] = useState("")
  const [tlList, setTlList] = useState<{ key: string; label: string; checked: boolean; nomor: string }[]>(
    TINDAK_LANJUT.map(tl => ({ ...tl, checked: false, nomor: "" }))
  )

  const [perdamaianMateriil, setPerdamaianMateriil] = useState<Record<string, boolean>>({})
  const [perdamaianPembatas, setPerdamaianPembatas] = useState<Record<string, boolean>>({})
  const [perdamaianFormil, setPerdamaianFormil] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)

  const router = useRouter()

  const title = (config?.title as string) ?? "Proses Paminal"
  const docTypes = STAGE_DOC_TYPES[stage] ?? []

  const datePreview = gelarTanggal
    ? new Date(gelarTanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""

  function handleGelarDateChange(val: string) {
    setGelarTanggal(val)
    if (val) {
      const d = new Date(val + "T00:00:00")
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      if (!gelarNotulen || gelarNotulen === autoNotulen) {
        const auto = buildNomor("notulen_gelar", "1", m, y, "Subbid Paminal")
        setGelarNotulen(auto)
        setAutoNotulen(auto)
      }
    }
  }

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
    const isProsesLidik = ["pemberitahuan_awal", "uuk", "sprinlidik", "renbut"].includes(docType)
    
    setter(prev => {
      let nextNomor = prev.nomor
      if (val && isProsesLidik) {
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
          catatan: catatanLidik,
        }),
      })
      router.refresh()
    } catch {}
    finally { setUpdatingStatus(false) }
  }
  async function handleStageUpdate() {
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
          catatan,
          dokumen: [], // dokumen dikirim lewat simpanDok masing-masing
          hasil: stage === "pelaporan" ? hasil : undefined,
          terbukti: stage === "pelaporan" ? hasil === "terbukti" : undefined,
          gelar_tanggal: stage === "pelaporan" ? gelarTanggal : undefined,
          gelar_notulen: stage === "pelaporan" ? gelarNotulen : undefined,
          pelimpahan: stage === "pelaporan" && hasil === "terbukti" ? pelimpahan : undefined,
          pelanggar_nama: stage === "pelaporan" && hasil === "terbukti" ? pelanggarNama : undefined,
          pelanggar_nrp: stage === "pelaporan" && hasil === "terbukti" ? pelanggarNrp : undefined,
          pelanggar_jabatan: stage === "pelaporan" && hasil === "terbukti" ? pelanggarJabatan : undefined,
          kategori_pelanggaran: stage === "pelaporan" && hasil === "terbukti" ? kategoriPelanggaran : undefined,
          wujud_perbuatan: stage === "pelaporan" && hasil === "terbukti" ? wujudPerbuatan : undefined,
          pasal_dilanggar: stage === "pelaporan" && hasil === "terbukti" ? pasalDilanggar : undefined,
          perdamaian_materiil: stage === "pelaporan" && hasil === "perdamaian" ? perdamaianMateriil : undefined,
          perdamaian_pembatas: stage === "pelaporan" && hasil === "perdamaian" ? perdamaianPembatas : undefined,
          perdamaian_formil: stage === "pelaporan" && hasil === "perdamaian" ? perdamaianFormil : undefined,
          tindak_lanjut: stage === "pelaporan" ? tlList : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      setCatatan("")
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
            <p className="text-[10px] text-gray-500 mb-0.5">Tanggal</p>
            <DateInput value={block.tanggal} onChange={val => handleTanggal(setter, val, docType)}
              className="text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Nomor Lengkap</p>
            <input type="text" value={block.nomor}
              onChange={e => setter(p => ({ ...p, nomor: e.target.value }))}
              placeholder="Isi nomor lengkap..."
              className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7 placeholder:text-gray-600" />
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
          <button onClick={() => simpanDok(docType, block, setter)} disabled={block.saving || !block.tanggal || !block.nomor}
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
            <p className="text-[10px] text-gray-400 mb-1">File Terlampir:</p>
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
        {(unitStatus === "dalam_proses" || !unitStatus) && !isDone && (
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
                {renderDocBlock("Renbut Anggaran", "renbut", renbut, setRenbut)}
                <hr className="border-gray-700" />

                {/* Catatan + Update Status */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400">Catatan</p>
                  <Textarea value={catatanLidik} onChange={e => setCatatanLidik(e.target.value)}
                    placeholder="Tulis catatan progress..."
                    className="min-h-[50px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500" />
                  <button onClick={handleUpdateStatusLidik} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-violet-700 hover:bg-violet-600 text-white rounded disabled:opacity-40">
                    {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Update Status → PROSES LIDIK
                  </button>
                </div>

              </div>
            )}

            {/* Tab: Pelaporan */}
            {activeTab === "pelaporan" && (
              <div className="space-y-3">
                {/* Gelar Perkara */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-300">Gelar Perkara</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Tanggal</p>
                      <DateInput value={gelarTanggal} onChange={val => {
                        setGelarTanggal(val)
                        if (val && (!gelarNotulen || gelarNotulen === autoNotulen)) {
                          const d = new Date(val + "T00:00:00")
                          const auto = buildNomor("notulen_gelar", "     ", d.getMonth() + 1, d.getFullYear(), "Subbid Paminal", customTemplates)
                          setGelarNotulen(auto)
                          setAutoNotulen(auto)
                        }
                      }} className="text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Nomor Notulen</p>
                      <input type="text" value={gelarNotulen} onChange={(e) => setGelarNotulen(e.target.value)}
                        placeholder="Notulen/..."
                        className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7 placeholder:text-gray-600" />
                    </div>
                  </div>
                </div>
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

                {/* Terduga Pelanggar (hanya jika Terbukti) */}
                {hasil === "terbukti" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-yellow-400 mb-1">Identitas Pelanggar</p>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Nama</p>
                        <input type="text" value={pelanggarNama} onChange={(e) => setPelanggarNama(e.target.value)}
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[10px] text-gray-500 mb-0.5">Pangkat</p>
                          <Select value={pelanggarPangkat} onValueChange={(v) => setPelanggarPangkat(v ?? "")}>
                            <SelectTrigger className="w-full text-xs bg-[#1E293B] border-gray-600 text-gray-200 h-7">
                              <SelectValue placeholder="Pilih Pangkat..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pati">Pati (Jenderal)</SelectItem>
                              <SelectItem value="pamen">Pamen (Kombes/AKBP/Kompol)</SelectItem>
                              <SelectItem value="pama">Pama (AKP/Iptu/Ipda)</SelectItem>
                              <SelectItem value="bintara">Bintara</SelectItem>
                              <SelectItem value="tamtama">Tamtama</SelectItem>
                              <SelectItem value="pns">PNS Polri</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 mb-0.5">NRP / NIP (8 atau 16 digit)</p>
                          <input type="text" value={pelanggarNrp} onChange={(e) => setPelanggarNrp(e.target.value.replace(/\D/g, ""))}
                            maxLength={18}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <p className="text-[10px] text-gray-500 mb-0.5">Jabatan</p>
                          <input type="text" value={pelanggarJabatan} onChange={(e) => setPelanggarJabatan(e.target.value)}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 mb-0.5">Kesatuan</p>
                          <input type="text" value={pelanggarKesatuan} onChange={(e) => setPelanggarKesatuan(e.target.value)}
                            className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Kategori Pelanggaran</p>
                        <Select value={kategoriPelanggaran} onValueChange={(v) => setKategoriPelanggaran(v ?? "")}>
                          <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                            <SelectValue placeholder="Pilih kategori..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disiplin">Pelanggaran Disiplin</SelectItem>
                            <SelectItem value="kode_etik">Pelanggaran Kode Etik (KEPP)</SelectItem>
                            <SelectItem value="pidana">Tindak Pidana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Wujud Perbuatan</p>
                        <input type="text" list="wujud-list" value={wujudPerbuatan} onChange={(e) => setWujudPerbuatan(e.target.value)}
                          placeholder="Ketik atau pilih wujud perbuatan..."
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                        <datalist id="wujud-list">
                          {WUJUD_PERBUATAN_LIST.map(w => <option key={w} value={w} />)}
                        </datalist>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Pasal yang Dilanggar</p>
                        <input type="text" list="pasal-list" value={pasalDilanggar} onChange={(e) => setPasalDilanggar(e.target.value)}
                          placeholder="Ketik atau pilih pasal yang dilanggar..."
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                        <datalist id="pasal-list">
                          {PASAL_LIST.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Pelimpahan ke</p>
                        <Select value={pelimpahan} onValueChange={(v) => setPelimpahan(v ?? "")}>
                          <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                            <SelectValue placeholder="Pilih unit tujuan..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="provos">Subbid Provos</SelectItem>
                            <SelectItem value="wabprof">Subbid Wabprof</SelectItem>
                            <SelectItem value="polres">Polres</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Catatan + Update Status */}
                <div className="space-y-1.5 pt-2 border-t border-gray-700">
                  <p className="text-xs font-semibold text-gray-400">Catatan Pelaporan</p>
                  <Textarea value={catatan} onChange={e => setCatatan(e.target.value)}
                    placeholder="Tulis catatan hasil lidik..."
                    className="min-h-[50px] text-xs bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500" />
                  <button onClick={handleStageUpdate} disabled={loading || !hasil}
                    className="w-full flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded disabled:opacity-40">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Update Status → {hasil === "terbukti" ? "LAPORAN SELESAI" : hasil === "perdamaian" ? "RESTORATIVE JUSTICE" : hasil === "tidak_terbukti" ? "TIDAK TERBUKTI" : "Pilih Hasil"}
                  </button>
                </div>

              </div>
            )}

            {/* Tab: Tindak Lanjut */}
            {activeTab === "tindak_lanjut" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 mb-1">Tindak Lanjut Wajib</p>
                {tlList.map((tl, idx) => (
                  <div key={tl.key} className="flex items-center gap-2 mb-1">
                    <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tl.checked}
                        onChange={() => toggleTl(idx)}
                        className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]"
                      />
                      {tl.label}
                    </label>
                    {tl.checked && (
                      <input
                        type="text"
                        value={tl.nomor}
                        onChange={(e) => setTlNomor(idx, e.target.value)}
                        placeholder="No"
                        className="w-20 text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-6"
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={salinRekap}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Tersalin!" : "Salin Rekap"}
                </button>
              </div>
            )}

            {/* Tab: Rekap */}
            {activeTab === "rekap" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 mb-1">Ringkasan</p>
                <div className="text-xs text-gray-300 space-y-1">
                  <p><span className="text-gray-500">Tahap:</span> {STAGES.find(s => s.value === stage)?.label}</p>
                  {gelarTanggal && (
                    <p><span className="text-gray-500">Gelar:</span> {datePreview}</p>
                  )}
                  {gelarNotulen && (
                    <p><span className="text-gray-500">Notulen:</span> {gelarNotulen}</p>
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

                <button
                  onClick={handleStageUpdate}
                  disabled={loading}
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
