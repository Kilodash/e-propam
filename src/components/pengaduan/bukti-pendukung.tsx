"use client"

import { useEffect, useState } from "react"
import { SectionCard } from "./detail-gajamada"
import { FileText, Download, ExternalLink, FileImage, FileVideo, File } from "lucide-react"

function fileName(url: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split("/").pop() ?? "Lampiran"
    return decodeURIComponent(last)
  } catch {
    return url
  }
}

function fileIcon(url: string) {
  const lower = url.toLowerCase()
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lower)) return FileImage
  if (/\.(mp4|mov|avi|webm|mkv)$/i.test(lower)) return FileVideo
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(lower)) return FileText
  return File
}

function fileSize(bytes?: number): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function BuktiPendukung({ prepetratorId }: { prepetratorId: string }) {
  const [list, setList] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/bukti?prepetratorId=${encodeURIComponent(prepetratorId)}`)
      .then(r => r.json())
      .then(json => setList(Array.isArray(json.data) ? json.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [prepetratorId])

  function downloadFile(url: string, name: string) {
    const a = document.createElement("a")
    a.href = url
    a.target = "_blank"
    a.rel = "noreferrer"
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function downloadAll() {
    list.forEach((row, i) => {
      const url: string = row.url ?? row.file_url
      const name: string = row.file_name ?? row.name ?? (url ? fileName(url) : `Lampiran ${i + 1}`)
      if (url) {
        setTimeout(() => downloadFile(url, name), i * 300)
      }
    })
  }

  return (
    <SectionCard
      title="Bukti (Lampiran)"
      badge={loading ? "..." : `${list.length}`}
      className="h-full"
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
        <p className="text-xs text-gray-400 italic">Belum ada lampiran.</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((row, idx) => {
            const url: string | undefined = row.url ?? row.file_url
            const name: string = row.file_name ?? row.name ?? (url ? fileName(url) : `Lampiran ${idx + 1}`)
            if (!url) return null
            const Icon = fileIcon(url)
            const size = fileSize(row.file_size)
            return (
              <li key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-800 truncate">{name}</div>
                  {size && <div className="text-xs text-gray-400">{size}</div>}
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#0369A1] hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Buka langsung dari Gajamada"
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
