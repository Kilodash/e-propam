import type { TimelineItem } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"

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

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  yanduan: "Yanduan",
  kabid: "Kabid Propam",
  paminal: "Paminal",
  provos: "Provos",
  wabprof: "Wabprof",
  rehabpers: "Rehabpers",
  polres: "Polres",
  wassidik: "Wassidik",
}

export default function TimelineStepper({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-gray-500 text-sm py-4">Belum ada aktivitas</p>
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        if (item.kind === "catatan") {
          const c = item.entry
          return (
            <div key={`cat-${c.id}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-600 mt-1.5 shrink-0" />
                {i < items.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-300 min-h-[24px]" />
                )}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">
                      {ROLE_LABELS[c.author_role] ?? c.author_role} • {c.author_email}
                    </p>
                    <p className="text-gray-800 text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                  </div>
                  <p className="text-gray-500 text-xs shrink-0">{formatDateShort(c.created_at)}</p>
                </div>
              </div>
            </div>
          )
        }

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
              {!isEmpty(g.officer_name) && (
                <p className="text-gray-500 text-xs mt-1">
                  Oleh: {g.officer_name}
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
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0369A1] hover:underline text-xs"
                        >
                          {att.file_name || `Lampiran ${idx + 1}`}
                        </a>
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
