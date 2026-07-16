import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { STATUS_OPTIONS } from "@/lib/aksi-cards/presets"

export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get("all") === "1"
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("pengaduan")
    .select("status_label")
    .not("status_label", "is", null)

  const counts = new Map<string, number>()
  for (const r of (data ?? []) as { status_label: string }[]) {
    if (r.status_label) {
      counts.set(r.status_label, (counts.get(r.status_label) ?? 0) + 1)
    }
  }

  const presetValues = STATUS_OPTIONS.map(s => s.value)
  for (const p of presetValues) {
    if (!counts.has(p)) counts.set(p, 0)
  }

  let allowed: string[] | null = null
  if (!showAll) {
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "allowed_status_labels")
      .maybeSingle()
    allowed = Array.isArray(setting?.value) ? (setting!.value as string[]) : null
  }

  const all = [...counts.entries()]
    .filter(([value]) => !allowed || allowed.includes(value))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({
      value,
      label: count > 0 ? `${value} (${count})` : value,
      count,
    }))

  return NextResponse.json({ data: all })
}
