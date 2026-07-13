"use server"

import { createServerClient } from "@/lib/supabase/server"
import { queryGajamada, queryGajamadaAll } from "./client"
import type { Pengaduan, TimelineEntry, Attachment } from "@/types"

const POLD_CODE = Number(process.env.POLD_CODE) || 6013

function mapRowToPengaduan(row: string[]): Pengaduan {
  return {
    id: row[0] || "",
    prepetrator_id: row[1] || "",
    pengirim: row[13] || null,
    phone_no: row[10] || null,
    email: row[15] || null,
    category: row[8] || null,
    content: null,
    summary: row[14] || null,
    status_label: row[17] || null,
    case_position: row[12] || null,
    disposisi_polda: row[9] || null,
    disposisi_polres: null,
    disposisi_police_function: row[11] || null,
    polda_code: POLD_CODE,
    source: row[16] || null,
    source_alias: null,
    created_date: new Date(Number(row[2]) || 0).toISOString(),
    updated_at: new Date(Number(row[3]) || 0).toISOString(),
    synced_at: new Date().toISOString(),
  }
}

export async function syncInbound(): Promise<{ count: number; error?: string }> {
  const supabase = await createServerClient()

  const logResult = await supabase
    .from("sync_log")
    .insert({
      direction: "inbound",
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  try {
    const rows = await queryGajamadaAll(
      "c732cb91b75e04b1f39d19d98dabc0ef",
      ["a3f0e8c7d9b24e5f8123456789abcdef"],
      "Informasi Dasar Laporan",
      [
        {
          table: 'aduan_masyarakat_v3."report"',
          field: "polda_disposisi",
          fieldType: "character varying",
          operator: "is",
          value: { is: "POLDA JAWA BARAT", isOneOf: [] },
        },
      ]
    )

    const pengaduanList: Pengaduan[] = rows.map(mapRowToPengaduan)

    const { error } = await supabase
      .from("pengaduan")
      .upsert(pengaduanList, { onConflict: "id" })

    if (error) throw error

    await supabase
      .from("sync_log")
      .update({
        status: "success",
        records_count: pengaduanList.length,
        finished_at: new Date().toISOString(),
      })
      .eq("id", logResult.data!.id)

    return { count: pengaduanList.length }
  } catch (err: any) {
    await supabase
      .from("sync_log")
      .update({
        status: "error",
        error_message: err.message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", logResult.data!.id)

    return { count: 0, error: err.message }
  }
}

export async function syncTimeline(prepetratorId: string): Promise<number> {
  const supabase = await createServerClient()

  try {
    const rows = await queryGajamadaAll(
      "7761377da75e04b1f39d19d98dabc0ef",
      ["b4f1e9d0c83247569abcdef123456789"],
      "Timeline",
      [
        {
          table: 'aduan_masyarakat_v3."report_officer_detail"',
          field: "prepetrator_id",
          fieldType: "character varying",
          operator: "is",
          value: { is: prepetratorId, isOneOf: [] },
        },
      ]
    )

    const timeline: TimelineEntry[] = rows.map((row) => ({
      id: crypto.randomUUID(),
      prepetrator_id: row[0] || "",
      status: row[4] || null,
      status_alias: row[5] || null,
      case_position: row[11] || null,
      date_activity: row[6] || null,
      handling_progress: row[8] || null,
      officer_name: row[7] || null,
      attachments: [],
    }))

    if (timeline.length > 0) {
      await supabase.from("timeline").upsert(timeline, { onConflict: "id" })
    }

    return timeline.length
  } catch {
    return 0
  }
}

export async function getSyncStatus(): Promise<{
  last_sync: string | null
  in_progress: boolean
  total_records: number
  error: string | null
}> {
  const supabase = await createServerClient()

  const { data: lastLog } = await supabase
    .from("sync_log")
    .select("*")
    .eq("direction", "inbound")
    .order("started_at", { ascending: false })
    .limit(1)
    .single()

  const { count } = await supabase
    .from("pengaduan")
    .select("*", { count: "exact", head: true })

  return {
    last_sync: lastLog?.started_at ?? null,
    in_progress: lastLog?.status === "in_progress",
    total_records: count ?? 0,
    error: lastLog?.error_message ?? null,
  }
}
