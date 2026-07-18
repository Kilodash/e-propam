import { NextResponse } from "next/server"
import { loginGajamada } from "@/lib/gajamada/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cookie = await loginGajamada()
    if (!cookie) {
      return NextResponse.json({ connected: false, error: "Login failed — no cookie returned" })
    }
    return NextResponse.json({ connected: true })
  } catch (e: unknown) {
    return NextResponse.json({ connected: false, error: e instanceof Error ? e.message : "Unknown error" })
  }
}
