import type { TimelineEntry } from "@/types"
import { format } from "date-fns"
import { id } from "date-fns/locale"

function isEmpty(v: string | null | undefined): boolean {
  if (!v) return true
  const trimmed = v.trim()
  if (!trimmed) return true
  if (trimmed === "-") return true
  return false
}

export default function TimelineStepper({
  entries,
}: {
  entries: TimelineEntry[]
}) {
  if (entries.length === 0) {
    return <p className="text-gray-400 py-4">Belum ada aktivitas</p>
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-[#0369A1] mt-1.5 shrink-0" />
            {i < entries.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-600 min-h-[24px]" />
            )}
          </div>
          <div className="pb-4">
            <p className="text-white font-medium text-sm">
              {entry.status_alias ?? entry.status ?? "-"}
            </p>
            {entry.date_activity && (
              <p className="text-gray-400 text-xs">
                {format(new Date(entry.date_activity), "dd MMM yyyy, HH:mm", {
                  locale: id,
                })}
              </p>
            )}
            {!isEmpty(entry.case_position) && (
              <p className="text-gray-500 text-xs">{entry.case_position}</p>
            )}
            {!isEmpty(entry.handling_progress) && (
              <p className="text-gray-400 text-xs mt-1">
                {entry.handling_progress}
              </p>
            )}
            {!isEmpty(entry.officer_name) && (
              <p className="text-gray-500 text-xs">
                Oleh: {entry.officer_name}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
