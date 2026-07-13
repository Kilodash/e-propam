import { NextRequest, NextResponse } from "next/server"
import { syncInbound } from "@/lib/gajamada/sync"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (authHeader === `Bearer ${cronSecret}`) {
    const result = await syncInbound()
    if (result.error) {
      return NextResponse.json(result, { status: 500 })
    }
    return NextResponse.json(result)
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const result = await syncInbound()
    if (result.error) {
      return NextResponse.json(result, { status: 500 })
    }
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
