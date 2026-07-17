"use client"

import { useState } from "react"
import { SectionCard } from "./detail-gajamada"
import { FileText, Download, ExternalLink, FileImage, FileVideo, File, RefreshCw } from "lucide-react"
import { useEffect } from "react"

// --- Shared helpers (same as bukti-pendukung.tsx) ---

function isImage(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url)
}

function isVideo(url: string): boolean {
  return /\.(mp4|mov|avi|webm|mkv)$/i.test(url)
}

function fileThumb(url: string) {
  return isImage(url) ? "image" : isVideo(url) ? "video" : /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url.toLowerCase()) ? "doc" : "file"
}

const GAJAMADA_BASE = "https://gajamada-propam.polri.go.id"

function toCdnUrl(rawUrl: string): string {
  if (rawUrl.startsWith("s3://fusion/agent/")) {
    const key = rawUrl.replace("s3://fusion/agent/", "")
    return `${GAJAMADA_BASE}/cdn/media/fusion/agent/${key}`
  }
  return rawUrl
}

function FileThumb({ url, name }: { url: string; name: string }) {
  const [error, setError] = useState(false)
  const type = fileThumb(url)

  if (type !== "image") {
    const Icon = type === "video" ? FileVideo : type === "doc" ? FileText : File
    return <Icon className="w-10 h-10 text-gray-500 shrink-0" />
  }

  if (error) {
    return <FileImage className="w-10 h-10 text-gray-500 shrink-0" />
  }

  return (
    <img
      src={downloadUrl(url, name)}
      alt={name}
      loading="lazy"
      onError={() => setError(true)}
      className="w-10 h-10 object-cover rounded shrink-0 border border-gray-200"
    />
  )
}

function downloadUrl(raw: string, name: string, dl?: boolean): string {
  const params = new URLSearchParams({ url: raw, filename: name })
  if (dl) params.set("download", "1")
  return `/api/bukti/download?${params.toString()}`
}

function fileName(raw: string): string {
  try {
    const u = new URL(raw)
    const last = u.pathname.split("/").pop() ?? "Lampiran"
    return decodeURIComponent(last)
  } catch {
    return raw
  }
}

function fileSize(bytes?: number): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ---

async function downloadFile(url: string, name: string) {
  const r = await fetch(downloadUrl(url, name, true))
  const blob = await r.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

function FileRow({ url, name, size, docType }: { url: string; name: string; size?: string; docType?: string | null }) {
  return (
    <li className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
      <FileThumb url={url} name={name} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-800 truncate">{name}</div>
        {docType && <div className="text-[10px] text-gray-400">{docType}</div>}
        {size && <div className="text-xs text-gray-400">{size}</div>}
      </div>
      <a
        href={downloadUrl(url, name)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 px-2 py-1 text-xs text-[#0369A1] hover:text-blue-600 hover:bg-blue-50 rounded"
        title="Buka file"
      >
        <ExternalLink className="w-3 h-3" /> Buka
      </a>
      <button
        onClick={() => downloadFile(url, name)}
        className="flex items-center gap-1 px-2 py-1 text-xs text-[#0369A1] hover:text-blue-600 hover:bg-blue-50 rounded"
        title="Unduh file"
      >
        <Download className="w-3 h-3" /> Unduh
      </button>
    </li>
  )
}

interface Props {
  prepetratorId: string
  pengaduanId: string
  className?: string
}

const DOC_LABELS: Record<string, string> = {
  pemberitahuan_awal: "Pemberitahuan Awal",
  uuk: "UUK",
  sprinlidik: "Sprin Lidik",
  renbut: "Renbut Anggaran",
  lhp: "LHP",
  nota_dinas: "Nota Dinas",
  notulen_gelar: "Notulen Gelar",
}

export default function BuktiTabs({ prepetratorId, pengaduanId, className }: Props) {
  const [active, setActive] = useState("gajamada")

  const [gajamadaList, setGajamadaList] = useState<Record<string, any>[]>([])
  const [gajamadaLoading, setGajamadaLoading] = useState(true)

  const [epropamList, setEpropamList] = useState<any[]>([])
  const [epropamLoading, setEpropamLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchGajamada() {
    try {
      const r = await fetch(`/api/bukti?prepetratorId=${encodeURIComponent(prepetratorId)}`)
      const json = await r.json()
      setGajamadaList(Array.isArray(json.data) ? json.data : [])
    } catch {
      setGajamadaList([])
    } finally {
      setGajamadaLoading(false)
    }
  }

  async function fetchEpropam() {
    try {
      const [localRes, rekapRes] = await Promise.all([
        fetch(`/api/bukti?pengaduanId=${encodeURIComponent(pengaduanId)}`),
        fetch(`/api/bukti?rekapPrepetratorId=${encodeURIComponent(prepetratorId)}`),
      ])
      const [localJson, rekapJson] = await Promise.all([localRes.json(), rekapRes.json()])
      const local = Array.isArray(localJson.data) ? localJson.data : []
      const rekap = Array.isArray(rekapJson.data) ? rekapJson.data : []
      const localUrls = new Set(local.map((r: any) => r.url ?? r.file_url).filter(Boolean))
      const merged = [...local, ...rekap.filter((r: any) => {
        const url = r.url ?? r.file_url
        return url && !localUrls.has(url)
      })]
      setEpropamList(merged)
    } catch {
      setEpropamList([])
    } finally {
      setEpropamLoading(false)
    }
  }

  useEffect(() => { fetchGajamada() }, [prepetratorId])
  useEffect(() => { fetchEpropam() }, [pengaduanId, prepetratorId])

  useEffect(() => {
    function handler() { doRefresh() }
    window.addEventListener("e-propam:file-uploaded", handler)
    return () => window.removeEventListener("e-propam:file-uploaded", handler)
  }, [])

  async function doRefresh() {
    setRefreshing(true)
    setGajamadaLoading(true)
    setEpropamLoading(true)
    await Promise.all([fetchGajamada(), fetchEpropam()])
    setRefreshing(false)
  }

  const currentList = active === "gajamada" ? gajamadaList : epropamList
  const currentLoading = active === "gajamada" ? gajamadaLoading : epropamLoading

  async function downloadAll() {
    const list = active === "gajamada" ? gajamadaList : epropamList
    for (const row of list) {
      const url: string = row.url ?? row.file_url
      const name: string = row.file_name ?? row.name ?? (url ? fileName(url) : "Lampiran")
      if (url) {
        await downloadFile(url, name)
        await new Promise(r => setTimeout(r, 300))
      }
    }
  }

  return (
    <SectionCard
      title="Bukti (Lampiran)"
      className={className}
      scrollable
      action={
        <div className="flex items-center gap-3">
          <button
            onClick={doRefresh}
            disabled={refreshing}
            className="text-xs text-gray-400 hover:text-white font-medium flex items-center gap-1"
            title="Refresh lampiran"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {currentList.length > 0 ? (
            <button
              onClick={downloadAll}
              className="text-xs text-[#0369A1] hover:text-blue-500 font-medium flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Unduh Semua
            </button>
          ) : null}
        </div>
      }
    >
      <div className="flex gap-1 border-b border-gray-200 mb-3 -mx-2 px-2">
        <button
          onClick={() => setActive("gajamada")}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            active === "gajamada"
              ? "border-[#0369A1] text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Bukti Lampiran ({gajamadaList.length})
        </button>
        <button
          onClick={() => setActive("epropam")}
          className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
            active === "epropam"
              ? "border-[#0369A1] text-gray-900"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Dokumen Upload ({epropamList.length})
        </button>
      </div>

      {currentLoading ? (
        <div className="flex justify-center py-4">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : currentList.length === 0 ? (
        <p className="text-xs text-gray-400 italic">
          {active === "gajamada" ? "Belum ada bukti lampiran." : "Belum ada dokumen upload."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {currentList.map((row, idx) => {
            const url: string | undefined = row.url ?? row.file_url
            const name: string = row.file_name ?? row.name ?? (url ? fileName(url) : `Lampiran ${idx + 1}`)
            if (!url) return null
            const size = row.file_size ? fileSize(row.file_size) : undefined
            const docType = active === "epropam"
              ? (row.doc_type ? DOC_LABELS[row.doc_type] ?? row.doc_type : row.report_type ?? null)
              : undefined
            return <FileRow key={idx} url={url} name={name} size={size} docType={docType} />
          })}
        </ul>
      )}
    </SectionCard>
  )
}
