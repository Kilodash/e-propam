import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { STATUS_OPTIONS } from "@/lib/aksi-cards/presets"

export async function GET() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("pengaduan")
    .select("status_label")
    .not("status_label", "is", null)

  const fromDb = new Set((data ?? []).map(r => r.status_label).filter(Boolean))
  const presetValues = STATUS_OPTIONS.map(s => s.value)

  // Merge: DB statuses + preset statuses (no duplicates)
  for (const p of presetValues) fromDb.add(p)

  const all = [...fromDb].sort()

  return NextResponse.json({
    data: all.map(s => ({ value: s, label: s })),
  })
}
