import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pengaduanId = searchParams.get("pengaduanId")
  const prepetratorId = searchParams.get("prepetratorId")

  if (!pengaduanId) {
    return NextResponse.json({ success: false, error: "pengaduanId wajib" }, { status: 400 })
  }

  const supabase = createServiceClient()
  let q = supabase
    .from("pelanggar_paminal")
    .select("*")
    .eq("pengaduan_id", pengaduanId)
    .order("updated_at", { ascending: false })

  if (prepetratorId) q = q.eq("prepetrator_id", prepetratorId)

  const { data, error } = await q
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: data ?? [] })
}

interface PelanggarRowPayload {
  pengaduanId?: string
  pengaduan_id?: string
  prepetratorId?: string
  prepetrator_id?: string
  key?: string
  client_key?: string
  nama?: string | null
  pangkat?: string | null
  nrp?: string | null
  jabatan?: string | null
  kesatuan?: string | null
  functional?: string | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
  telpon?: string | null
  pendidikan?: string | null
  jenis_kelamin?: string | null
  wujud?: string | null
  kategori?: string | null
  sub_kategori?: string | null
  pasal_disiplin?: string[]
  pasal_kke?: string[]
  prepetrator_type?: string | null
  prepetrator_description?: string | null
  gajamada_synced_at?: string | null
  created_by?: string | null
}

export async function POST(request: NextRequest) {
  let body: { action?: string; rows?: PelanggarRowPayload[] }
  try {
    body = await request.json() as { action?: string; rows?: PelanggarRowPayload[] }
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const { action, rows } = body
  if (action !== "upsert_paminal") {
    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 })
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ success: true, message: "Tidak ada data" })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const payloads = rows.map((r) => ({
    pengaduan_id: String(r.pengaduanId ?? r.pengaduan_id),
    prepetrator_id: String(r.prepetratorId ?? r.prepetrator_id),
    client_key: String(r.key ?? r.client_key ?? crypto.randomUUID()),
    nama: r.nama ?? null,
    pangkat: r.pangkat ?? null,
    nrp: r.nrp ?? null,
    jabatan: r.jabatan ?? null,
    kesatuan: r.kesatuan ?? null,
    functional: r.functional ?? null,
    tempat_lahir: r.tempat_lahir ?? null,
    tanggal_lahir: r.tanggal_lahir ?? null,
    telpon: r.telpon ?? null,
    pendidikan: r.pendidikan ?? null,
    jenis_kelamin: r.jenis_kelamin ?? null,
    wujud: r.wujud ?? null,
    kategori: r.kategori ?? null,
    sub_kategori: r.sub_kategori ?? null,
    pasal_disiplin: r.pasal_disiplin ?? [],
    pasal_kke: r.pasal_kke ?? [],
    prepetrator_type: r.prepetrator_type ?? null,
    prepetrator_description: r.prepetrator_description ?? null,
    gajamada_synced_at: r.gajamada_synced_at ?? null,
    created_by: r.created_by ?? "system",
    updated_at: now,
  }))

  const { data, error } = await supabase
    .from("pelanggar_paminal")
    .upsert(payloads, { onConflict: "pengaduan_id,prepetrator_id,client_key" })
    .select()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: data ?? [] })
}
