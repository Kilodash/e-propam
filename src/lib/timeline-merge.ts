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

  const gajamada = await getTimelineFromGajamada(prepetratorId).catch(() => [] as TimelineEntry[])

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
