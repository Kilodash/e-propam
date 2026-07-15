import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = createServiceClient()
  const body = await request.json()
  const { pengaduan_id, prepetrator_id, author_email, author_role, content } = body

  if (!pengaduan_id || !prepetrator_id || !author_email || !author_role || !content) {
    return NextResponse.json({ success: false, error: "Field wajib tidak lengkap" }, { status: 400 })
  }

  const trimmed = String(content).trim()
  if (!trimmed) {
    return NextResponse.json({ success: false, error: "Catatan tidak boleh kosong" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("catatan")
    .insert({
      pengaduan_id,
      prepetrator_id,
      author_email,
      author_role,
      content: trimmed,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, catatan: data })
}
