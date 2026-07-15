import { NextRequest, NextResponse } from "next/server"
import { getNextRegisterNumber, incrementRegister } from "@/lib/aksi-cards/buku-register"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const unit = searchParams.get("unit")
  const docType = searchParams.get("doc_type")
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10)

  if (!unit || !docType) {
    return NextResponse.json({ success: false, error: "unit dan doc_type wajib" }, { status: 400 })
  }

  const next = await getNextRegisterNumber(unit, docType, year)
  return NextResponse.json({ success: true, next_number: next })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { unit, doc_type, year } = body

  if (!unit || !doc_type || !year) {
    return NextResponse.json({ success: false, error: "unit, doc_type, dan year wajib" }, { status: 400 })
  }

  const result = await incrementRegister(unit, doc_type, year)
  return NextResponse.json({ success: true, ...result })
}
