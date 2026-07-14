import { NextRequest, NextResponse } from "next/server"
import { syncInbound } from "@/lib/gajamada/sync"

export async function POST(request: NextRequest) {
  try {
    const result = await syncInbound()
    return NextResponse.json(result, { status: result.error ? 500 : 200 })
  } catch (err: any) {
    return NextResponse.json({ count: 0, error: err.message }, { status: 500 })
  }
}
