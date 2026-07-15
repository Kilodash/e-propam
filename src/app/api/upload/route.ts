import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const pengaduanId = formData.get("pengaduan_id") as string | null
  const docType = formData.get("doc_type") as string | null

  if (!file || !pengaduanId) {
    return NextResponse.json({ success: false, error: "file dan pengaduan_id wajib" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const buffer = Buffer.from(await file.arrayBuffer())
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  const storagePath = `${pengaduanId}/${safeName}`

  const { data, error } = await supabase.storage
    .from("dokumen")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from("dokumen")
    .getPublicUrl(storagePath)

  return NextResponse.json({ success: true, url: urlData.publicUrl, path: storagePath })
}
