import { NextResponse } from "next/server"
import { getSyncStatus } from "@/lib/gajamada/sync"

export async function GET() {
  const status = await getSyncStatus()
  return NextResponse.json(status)
}
