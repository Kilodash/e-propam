import { NextRequest, NextResponse } from "next/server"
import { syncInbound } from "@/lib/gajamada/sync"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await syncInbound()

  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result)
}
