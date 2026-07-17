"use client"

import type { TimelineItem } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"

function downloadUrl(raw: string, name: string, dl?: boolean): string {
  const params = new URLSearchParams({ url: raw, filename: name })
  if (dl) params.set("download", "1")
  return `/api/bukti/download?${params.toString()}`
}

function isEmpty(v: string | null | undefined): boolean {
  if (!v) return true
  const trimmed = v.trim()
  if (!trimmed) return true
  if (trimmed === "-") return true
  return false
}

function formatDateId(d: string | null): string {
  if (!d) return "-"
  try {
    return format(new Date(d), "dd MMM yyyy, HH:mm", { locale: id }) + " WIB"
  } catch {
    return "-"
  }
}

function formatDateShort(d: string | null): string {
  if (!d) return "-"
  try {
    return format(new Date(d), "dd MMM yyyy, HH:mm", { locale: id })
  } catch {
    return "-"
  }
}

export default function TimelineStepper({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-gray-500 text-sm py-4">Belum ada aktivitas</p>
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        if (item.kind === "catatan") return null

        const g = item.entry
        const title = g.status_alias ?? g.status ?? g.handling_progress ?? "Aktivitas"
        return (
          <div key={`gaj-${g.id}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-[#0369A1] mt-1.5 shrink-0" />
              {i < items.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-300 min-h-[24px]" />
              )}
            </div>
            <div className="pb-4 flex-1">
              <p className="text-gray-900 font-medium text-sm">
                {title}
              </p>
              {!isEmpty(g.case_position) && (
                <p className="text-gray-500 text-xs uppercase mt-0.5">
                  {g.case_position}
                </p>
              )}
              {g.date_activity && (
                <p className="text-gray-500 text-xs mt-1">
                  {formatDateId(g.date_activity)}
                </p>
              )}
              {!isEmpty(g.handling_progress) && title !== g.handling_progress && (
                <p className="text-gray-700 text-xs mt-2 whitespace-pre-wrap">
                  {g.handling_progress}
                </p>
              )}
              {!isEmpty(g.previous_case_position) && (
                <p className="text-gray-500 text-xs mt-1">
                  Dari: {g.previous_case_position}
                </p>
              )}
              {g.attachments && g.attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-gray-500 text-xs font-medium">Lampiran ({g.attachments.length})</p>
                  <ul className="space-y-1 mt-1">
                    {g.attachments.map((att, idx) => (
                      <li key={idx}>
                        <button
                          onClick={async () => {
                            const name = att.file_name || `Lampiran ${idx + 1}`
                            const r = await fetch(downloadUrl(att.url, name, true))
                            const blob = await r.blob()
                            const blobUrl = URL.createObjectURL(blob)
                            const a = document.createElement("a")
                            a.href = blobUrl
                            a.download = name
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(blobUrl)
                          }}
                          className="text-[#0369A1] hover:underline text-xs"
                        >
                          {att.file_name || `Lampiran ${idx + 1}`}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
