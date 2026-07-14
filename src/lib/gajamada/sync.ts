"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { fetchAllPengaduan } from "./client"
import { buildUnitMapping } from "./unit-mapping"
import type { Pengaduan } from "@/types"

const POLD_CODE = Number(process.env.POLD_CODE) || 6013

function mapRecord(record: Record<string, any>): Pengaduan {
  return {
    id: record.id ?? "",
    prepetrator_id: record.p_id ?? record.prepetrator_id ?? "",
    prepetrator_name: record.prepetrator_name ?? null,
    pengirim: record.pengirim ?? null,
    phone_no: record.phone_no ?? null,
    email: record.email ?? null,
    category: record.category ?? null,
    content: record.content ?? null,
    summary: record.summary ?? null,
    status_label: record.status_label ?? null,
    case_position: record.disposisi_case_position ?? null,
    disposisi_polda: record.disposisi_polda ?? null,
    disposisi_polres: record.disposisi_polres ?? null,
    disposisi_police_function: record.disposisi_police_function ?? null,
    polda_code: record.disposisi_polda_code ?? POLD_CODE,
    source: record.source ?? null,
    source_alias: record.source_alias ?? null,
    reporter_nik: record.reporter_nik ?? null,
    alamat_kejadian: record["5w1h_where"] ?? null,
    tgl_kejadian: record["5w1h_when"] ? new Date(record["5w1h_when"]).toISOString() : null,
    saran_kabid: null,
    telaah: null,
    telaah_at: null,
    kelengkapan: null,
    kelengkapan_at: null,
    disposisi_satker_tujuan: null,
    disposisi_satker_at: null,
    disposisi_submitted_at: null,
    disposisi_submitted_by: null,
    kabid_approval_status: null,
    kabid_approved_at: null,
    kabid_approved_by: null,
    kabid_catatan: null,
    kabid_rejected_reason: null,
    unit_status: null,
    unit_progress: null,
    unit_started_at: null,
    unit_completed_at: null,
    unit_officer: null,
    override_unit: null,
    override_alasan: null,
    override_at: null,
    override_by: null,
    kembalikan_alasan: null,
    kembalikan_at: null,
    kembalikan_by: null,
    created_date: record.created_date ? new Date(record.created_date).toISOString() : null,
    updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null,
    synced_at: new Date().toISOString(),
  }
}

export async function syncInbound(): Promise<{ count: number; error?: string; detail?: string }> {
  const supabase = createServiceClient()

  const { data: logEntry, error: logErr } = await supabase
    .from("sync_log")
    .insert({ direction: "inbound", status: "in_progress", started_at: new Date().toISOString() })
    .select("id")
    .single()

  if (logErr) return { count: 0, error: `sync_log insert: ${logErr.message}`, detail: logErr.details }

  try {
    const rows = await fetchAllPengaduan()
    const list = rows
      .map(mapRecord)
      .filter(p => p.id && p.id.length > 0) // skip empty/header rows
    const unique = new Map<string, Pengaduan>()
    for (const p of list) unique.set(p.id, p)
    const deduped = Array.from(unique.values())

    if (deduped.length === 0) {
      await supabase.from("sync_log").update({ status: "success", records_count: 0, finished_at: new Date().toISOString() }).eq("id", logEntry!.id)
      return { count: 0 }
    }

    const { error } = await supabase.from("pengaduan").upsert(deduped, { onConflict: "id" })
    if (error) throw error

    // Build unit mapping from synced data (async, don't fail on error)
    try { await buildUnitMapping() } catch (e) { console.error("Unit mapping build skipped:", e) }

    await supabase.from("sync_log").update({ status: "success", records_count: deduped.length, finished_at: new Date().toISOString() }).eq("id", logEntry!.id)
    return { count: deduped.length }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error("Sync inner error:", msg)
    await supabase.from("sync_log").update({ status: "error", error_message: msg, finished_at: new Date().toISOString() }).eq("id", logEntry!.id)
    return { count: 0, error: msg }
  }
}

export async function getSyncStatus() {
  const supabase = createServiceClient()

  const { data: lastLog } = await supabase
    .from("sync_log")
    .select("*")
    .eq("direction", "inbound")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

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
