import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.from("pelanggaran_mapping").select("*").order("wujud", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { wujud, kategori, sub_kategori, pasal_ids } = body
  if (!wujud) return NextResponse.json({ error: "wujud wajib" }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("pelanggaran_mapping")
    .upsert({ wujud, kategori: kategori || null, sub_kategori: sub_kategori || null, pasal_ids: pasal_ids || [], updated_at: new Date().toISOString() }, { onConflict: "wujud" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: refreshed } = await supabase.from("pelanggaran_mapping").select("*").order("wujud", { ascending: true })
  return NextResponse.json({ success: true, data: refreshed })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id wajib" }, { status: 400 })
  const supabase = createServiceClient()
  const { error } = await supabase.from("pelanggaran_mapping").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
