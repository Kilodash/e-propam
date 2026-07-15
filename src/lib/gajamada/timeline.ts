import { fetchTimeline } from "./client"
import type { TimelineEntry } from "@/types"

export async function getTimelineFromGajamada(prepetratorId: string): Promise<TimelineEntry[]> {
  const rows = await fetchTimeline(prepetratorId)

  return rows.map((r) => {
    // Date parse — Gajamada returns "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD HH:MM:SS.ffffff" in Asia/Jakarta
    let dateStr: string | null = null
    if (r.date_activity) {
      try {
        const raw = String(r.date_activity).trim()
        // Replace space separator with T and append timezone so JS parses as local WIB
        const normalized = raw.replace(" ", "T") + "+07:00"
        const d = new Date(normalized)
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString()
        }
      } catch { dateStr = null }
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
      subject: r.subject ?? null,
      previous_case_position: r.previous_case_position ?? null,
      type: r.type ?? null,
      attachments,
    } as TimelineEntry
  })
}
