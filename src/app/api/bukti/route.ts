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
    const { data, error } = await supabase
      .from("attachments")
      .select("url, file_name, file_type, doc_type, created_at")
      .eq("pengaduan_id", pengaduanId)
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data ?? [] })
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
