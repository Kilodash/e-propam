import type { SupabaseClient } from "@supabase/supabase-js"
import type { TimelineEntry } from "@/types"
import { unitToSatkerKey } from "./unit-satker-key"

export async function deriveUnitRiwayat(
  entries: TimelineEntry[],
  supabase: SupabaseClient
): Promise<void> {
  if (entries.length === 0) return

  const byP = new Map<string, TimelineEntry[]>()
  for (const e of entries) {
    if (!e.prepetrator_id) continue
    if (!byP.has(e.prepetrator_id)) byP.set(e.prepetrator_id, [])
    byP.get(e.prepetrator_id)!.push(e)
  }

  for (const [prepetratorId, evts] of byP) {
    const { data: p } = await supabase
      .from("pengaduan")
      .select("id")
      .eq("prepetrator_id", prepetratorId)
      .limit(1)
      .maybeSingle()
    if (!p) continue
    const pengaduanId = String(p.id)

    const sorted = [...evts].sort((a, b) =>
      (b.date_activity ?? "").localeCompare(a.date_activity ?? "")
    )
    const latest = sorted[0]
    const currentOwner = latest.case_position ?? ""

    if (!currentOwner) continue

    const satkerKeysTouched = new Set<string>()
    for (const e of evts) {
      if (e.case_position) satkerKeysTouched.add(unitToSatkerKey(e.case_position))
      if (e.previous_case_position)
        satkerKeysTouched.add(unitToSatkerKey(e.previous_case_position))
    }

    const rows = Array.from(satkerKeysTouched).map((sk) => {
      const isLocked = currentOwner.toUpperCase() !== sk
      return {
        pengaduan_id: pengaduanId,
        prepetrator_id: prepetratorId,
        satker_key: sk,
        current_owner: currentOwner,
        last_event_type: latest.type ?? null,
        last_event_nomor: latest.subject ?? null,
        last_event_at: latest.date_activity ?? null,
        last_status: latest.status_alias ?? latest.status ?? null,
        status: isLocked ? "dalam_penyidikan" : "aktif",
        att_count: latest.attachments?.length ?? 0,
        updated_at: new Date().toISOString(),
      }
    })

    if (rows.length > 0) {
      try {
        await supabase
          .from("unit_riwayat")
          .upsert(rows, { onConflict: "pengaduan_id,prepetrator_id,satker_key" })
      } catch { /* swallow — best-effort derive, jangan ganggu fetch timeline */ }
    }
  }
}
