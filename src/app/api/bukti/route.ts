import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { fetchBuktiPendukung, fetchRekapLaporan } from "@/lib/gajamada/client"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const prepetratorId = searchParams.get("prepetratorId")
  const pengaduanId = searchParams.get("pengaduanId")
  const rekapPrepetratorId = searchParams.get("rekapPrepetratorId")

  if (!prepetratorId && !pengaduanId && !rekapPrepetratorId) {
    return NextResponse.json({ error: "prepetratorId, pengaduanId, or rekapPrepetratorId required" }, { status: 400 })
  }

  // Fetch local attachments from Supabase
  if (pengaduanId) {
    const supabase = createServiceClient()
    const [attachmentsRes, dokumenRes] = await Promise.all([
      supabase
        .from("attachments")
        .select("url, file_name, file_type, doc_type, created_at")
        .eq("pengaduan_id", pengaduanId)
        .order("created_at", { ascending: false }),
      supabase
        .from("dokumen_perkara")
        .select("id, doc_type, nomor, tanggal, stage, file_url, prepetrator_id, created_at")
        .eq("pengaduan_id", pengaduanId)
        .order("created_at", { ascending: false }),
    ])
    if (attachmentsRes.error) return NextResponse.json({ error: attachmentsRes.error.message }, { status: 500 })

    const byDoc: Record<string, { nomor?: string; tanggal?: string | null; stage?: string | null; file_url?: string | null; created_at?: string | null }> = {}
    for (const d of (dokumenRes.data ?? []) as { doc_type: string; nomor?: string; tanggal?: string | null; stage?: string | null; file_url?: string | null; created_at?: string | null }[]) {
      if (!byDoc[d.doc_type]) byDoc[d.doc_type] = { ...d }
    }

    return NextResponse.json({
      data: attachmentsRes.data ?? [],
      dokumen: Object.entries(byDoc).map(([doc_type, v]) => ({ doc_type, ...v })),
    })
  }

  // Fetch Rekap Laporan from Gajamada (report_officer_attachments)
  if (rekapPrepetratorId) {
    try {
      const data = await fetchRekapLaporan(rekapPrepetratorId)
      return NextResponse.json({ data })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 502 })
    }
  }

  // Fetch Bukti Pendukung from Gajamada (report_attachments)
  try {
    const data = await fetchBuktiPendukung(prepetratorId!)
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}
