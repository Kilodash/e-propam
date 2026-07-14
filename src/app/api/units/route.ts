import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { extractSearchKey, sortUnits } from "@/lib/unit-search"

const VALID_LEVELS = ["kabid", "subbid", "subbag", "tabes", "polres", "brimob", "ditpolair", "wassidik"]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const level = searchParams.get("level")
  const disposition = searchParams.get("disposition")
  const admin = searchParams.get("admin")

  const supabase = createServiceClient()
  let query = supabase.from("unit_mapping").select("*")

  if (admin !== "true") query = query.eq("is_active", true)
  if (level) query = query.eq("satker_level", level)
  if (disposition === "true") query = query.in("satker_level", ["kabid", "subbid", "subbag", "wassidik"])

  query = query.order("satker_level", { ascending: true }).order("normalized_name", { ascending: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = (data ?? []).map((u: any) => ({ ...u, search_key: extractSearchKey(u.gajamada_name) }))
  return NextResponse.json({ data: sortUnits(enriched) })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, gajamada_name, normalized_name, police_function, satker_level, is_active } = body

  if (satker_level && !VALID_LEVELS.includes(satker_level))
    return NextResponse.json({ error: `Invalid satker_level: ${satker_level}` }, { status: 400 })

  const supabase = createServiceClient()
  const update: Record<string, any> = { source: "manual" }
  if (gajamada_name !== undefined) update.gajamada_name = gajamada_name
  if (normalized_name !== undefined) update.normalized_name = normalized_name
  if (police_function !== undefined) update.police_function = police_function
  if (satker_level !== undefined) update.satker_level = satker_level
  if (is_active !== undefined) update.is_active = is_active

  const { error } = await supabase.from("unit_mapping").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { gajamada_name, normalized_name, police_function, satker_level } = body

  if (!gajamada_name || !normalized_name || !satker_level)
    return NextResponse.json({ error: "gajamada_name, normalized_name, satker_level required" }, { status: 400 })
  if (!VALID_LEVELS.includes(satker_level))
    return NextResponse.json({ error: `Invalid satker_level: ${satker_level}` }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from("unit_mapping").insert({
    gajamada_name, normalized_name, police_function: police_function || null, satker_level,
    source: "manual", is_active: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase.from("unit_mapping").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
