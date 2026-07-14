import { fetchTimeline } from "./client"
import type { TimelineEntry } from "@/types"

export async function getTimelineFromGajamada(prepetratorId: string): Promise<TimelineEntry[]> {
  const rows = await fetchTimeline(prepetratorId)

  return rows.map((r) => {
    // Date parse
    let dateStr: string | null = null
    if (r.date_activity) {
      const ts = typeof r.date_activity === "number" ? r.date_activity : Number(r.date_activity)
      if (!isNaN(ts) && ts > 0) {
        try { dateStr = new Date(ts).toISOString() } catch { dateStr = null }
      }
    }

    // Parse attachments JSON if string
    let attachments: { url: string; file_name: string; size?: number }[] = []
    if (r.attachments) {
      try {
        attachments = typeof r.attachments === "string" ? JSON.parse(r.attachments) : r.attachments
      } catch { attachments = [] }
    }

    return {
      id: `${r.prepetrator_id}-${r.date_activity ?? Math.random()}`,
      prepetrator_id: r.prepetrator_id ?? "",
      status: r.status ?? null,
      status_alias: r.status_alias ?? null,
      case_position: r.case_position ?? null,
      date_activity: dateStr,
      handling_progress: r.handling_progress ?? null,
      officer_name: r.officer_report_name ?? r.responsible_person_name ?? null,
      attachments,
    } as TimelineEntry
  })
}
