import { NextRequest, NextResponse } from "next/server"
import { countByNik } from "@/lib/gajamada/client"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const nik = searchParams.get("nik")
  if (!nik) {
    return NextResponse.json({ error: "nik required" }, { status: 400 })
  }

  try {
    const count = await countByNik(nik)
    return NextResponse.json({ count })
  } catch (e: any) {
    return NextResponse.json({ count: 0, error: e.message })
  }
}
