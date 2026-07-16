import { NextRequest, NextResponse } from "next/server"
import { getAksiCardsForRole, upsertCardLayoutConfig } from "@/lib/aksi-cards/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role") ?? "yanduan"
  const userScope = searchParams.get("userScope") ?? undefined

  const data = await getAksiCardsForRole(role, userScope)
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { role, configs } = body

  if (!role || !Array.isArray(configs)) {
    return NextResponse.json({ success: false, error: "role and configs array required" }, { status: 400 })
  }

  const result = await upsertCardLayoutConfig(role, configs)
  if (!result.success) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
