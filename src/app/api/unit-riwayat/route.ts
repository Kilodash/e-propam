import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { unitToSatkerKey } from "@/lib/unit-satker-key"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const satkerParam = searchParams.get("satker") ?? ""
  const lockedParam = searchParams.get("locked")

  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthenticated" }, { status: 401 })
  }

  const satkerKey = unitToSatkerKey(satkerParam) || satkerParam
  if (!satkerKey || satkerKey === "UNKNOWN") {
    return NextResponse.json({ success: false, error: "satker param wajib" }, { status: 400 })
  }

  let q = supabase
    .from("unit_riwayat")
    .select("*")
    .eq("satker_key", satkerKey)
    .order("updated_at", { ascending: false })

  if (lockedParam === "true") q = q.eq("is_locked", true)
  else if (lockedParam === "false") q = q.eq("is_locked", false)

  const { data, error } = await q
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: data ?? [] })
}
