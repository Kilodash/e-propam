import { NextRequest, NextResponse } from "next/server"
import { fetchBuktiPendukung } from "@/lib/gajamada/client"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const prepetratorId = searchParams.get("prepetratorId")
  if (!prepetratorId) {
    return NextResponse.json({ error: "prepetratorId required" }, { status: 400 })
  }

  try {
    const data = await fetchBuktiPendukung(prepetratorId)
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}
