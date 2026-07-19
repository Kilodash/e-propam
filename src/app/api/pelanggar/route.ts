import { NextRequest, NextResponse } from "next/server"
import { fetchDataTerlapor } from "@/lib/gajamada/client"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const prepetratorId = searchParams.get("prepetrator_id")
  if (!prepetratorId) {
    return NextResponse.json({ success: false, error: "prepetrator_id wajib" }, { status: 400 })
  }

  try {
    console.log(`[pelanggar] fetchDataTerlapor for prepetrator_id: ${prepetratorId}`)
    const data = await fetchDataTerlapor(prepetratorId)
    console.log(`[pelanggar] result: ${data ? `found (${Object.keys(data).length} fields)` : "null"}`)
    if (!data) return NextResponse.json({ success: true, data: null })
    return NextResponse.json({ success: true, data })
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
