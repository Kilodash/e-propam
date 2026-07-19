import { NextRequest, NextResponse } from "next/server"
import { syncInbound } from "@/lib/gajamada/sync"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Cek apakah sync sedang berjalan
    const supabase = createServiceClient()
    const { data: running } = await supabase
      .from("sync_log")
      .select("id")
      .eq("direction", "inbound")
      .eq("status", "in_progress")
      .limit(1)
      .maybeSingle()

    if (running) {
      // Jika in_progress > 30 menit, anggap stale dan lanjutkan
      const { data: stale } = await supabase
        .from("sync_log")
        .select("started_at")
        .eq("id", running.id)
        .single()
      const startedAt = stale?.started_at ? new Date(stale.started_at).getTime() : 0
      const staleMs = 30 * 60 * 1000
      if (Date.now() - startedAt < staleMs) {
        return NextResponse.json({ count: 0, message: "Sync sedang berjalan, skip" })
      }
      // Stale lock — mark as error and continue
      await supabase.from("sync_log").update({ status: "error", error_message: "Stale lock cleared" }).eq("id", running.id)
    }

    const result = await syncInbound()
    return NextResponse.json(result, { status: result.error ? 500 : 200 })
  } catch (err: any) {
    return NextResponse.json({ count: 0, error: err.message }, { status: 500 })
  }
}
