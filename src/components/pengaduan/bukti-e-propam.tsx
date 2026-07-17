"use client"

import { useEffect, useState } from "react"
import { SectionCard } from "./detail-gajamada"
import { FileText, Download, ExternalLink, FileImage, FileVideo, File } from "lucide-react"

function isImage(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url)
}

function isVideo(url: string): boolean {
  return /\.(mp4|mov|avi|webm|mkv)$/i.test(url)
}

function fileThumb(url: string) {
  return isImage(url) ? "image" : isVideo(url) ? "video" : /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url.toLowerCase()) ? "doc" : "file"
}

function FileThumb({ url, name }: { url: string; name: string }) {
  const [error, setError] = useState(false)
  const type = fileThumb(url)

  if (type !== "image") {
    const Icon = type === "video" ? FileVideo : type === "doc" ? FileText : File
    return <Icon className="w-10 h-10 text-gray-400 shrink-0" />
  }

  if (error) {
    return <FileImage className="w-10 h-10 text-gray-400 shrink-0" />
  }

  return (
    <img
      src={url}
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

interface AttachmentRow {
  url: string
  file_name: string
  file_type: string | null
  doc_type: string | null
  created_at: string | null
}

interface Props {
  pengaduanId: string
  className?: string
}

export default function BuktiEpropam({ pengaduanId, className }: Props) {
  const [list, setList] = useState<AttachmentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bukti?pengaduanId=${encodeURIComponent(pengaduanId)}`)
      .then(r => r.json())
      .then(json => setList(Array.isArray(json.data) ? json.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [pengaduanId])

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

  async function downloadAll() {
    for (const row of list) {
      if (row.url) {
        downloadFile(row.url, row.file_name)
        await new Promise(r => setTimeout(r, 300))
      }
    }
  }

  return (
    <SectionCard
      title="Lampiran E-PROPAM"
      badge={loading ? "..." : `${list.length}`}
      className={className}
      scrollable
      action={
        list.length > 0 ? (
          <button
            onClick={downloadAll}
            className="text-xs text-[#0369A1] hover:text-blue-500 font-medium flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Unduh Semua
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Belum ada lampiran dari E-PROPAM.</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((row, idx) => {
            const url = row.url
            const name = row.file_name || `Lampiran ${idx + 1}`
            if (!url) return null
            return (
              <li key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                <FileThumb url={url} name={name} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-800 truncate">{name}</div>
                  {row.doc_type && <div className="text-[10px] text-gray-400">{row.doc_type}</div>}
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
          })}
        </ul>
      )}
    </SectionCard>
  )
}
