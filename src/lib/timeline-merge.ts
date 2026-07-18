"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getTimelineFromGajamada } from "@/lib/gajamada/timeline"
import type { Catatan, TimelineEntry, TimelineItem } from "@/types"

export async function getUnifiedTimeline(prepetratorId: string): Promise<TimelineItem[]> {
  const supabase = createServiceClient()

  const { data: catatanList } = await supabase
    .from("catatan")
    .select("*")
    .eq("prepetrator_id", prepetratorId)

  let gajamada: TimelineEntry[] = []
  let gajamadaFailed = false
  try {
    gajamada = await getTimelineFromGajamada(prepetratorId)
    // Cache to local timeline table for offline fallback
    if (gajamada.length > 0) {
      try {
        const rows = gajamada.map(g => ({
          id: g.id,
          prepetrator_id: g.prepetrator_id,
          status: g.status,
          status_alias: g.status_alias,
          case_position: g.case_position,
          date_activity: g.date_activity,
          handling_progress: g.handling_progress,
          officer_name: g.officer_name,
          subject: g.subject,
          previous_case_position: g.previous_case_position,
          type: g.type,
          attachments: g.attachments ?? [],
          synced_at: new Date().toISOString(),
        }))
        await supabase.from("timeline").upsert(rows, { onConflict: "id" })
      } catch { /* cache write non-critical */ }
    }
  } catch {
    gajamadaFailed = true
    // Fallback to local timeline table
    const { data: local } = await supabase
      .from("timeline")
      .select("*")
      .eq("prepetrator_id", prepetratorId)
      .order("date_activity", { ascending: false })
    if (local?.length) {
      gajamada = local as TimelineEntry[]
    }
  }

  const items: TimelineItem[] = []

  for (const c of (catatanList ?? []) as Catatan[]) {
    items.push({ kind: "catatan", date: c.created_at, entry: c })
  }

  for (const g of gajamada) {
    if (g.date_activity) {
      items.push({ kind: "gajamada", date: g.date_activity, entry: g })
    }
  }

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return items
}
