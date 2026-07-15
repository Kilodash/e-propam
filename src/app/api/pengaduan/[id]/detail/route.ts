import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { syncPengaduanDetail } from "@/lib/gajamada/detail-sync"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: row, error: lookupErr } = await supabase
    .from("pengaduan")
    .select("id, prepetrator_id")
    .eq("id", id)
    .single()

  if (lookupErr || !row) {
    return NextResponse.json({ success: false, error: "Pengaduan tidak ditemukan" }, { status: 404 })
  }

  const result = await syncPengaduanDetail(row.id, row.prepetrator_id)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 })
  }

  return NextResponse.json(result)
}
