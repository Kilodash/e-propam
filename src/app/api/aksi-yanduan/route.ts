import { NextRequest, NextResponse } from "next/server"
import {
  overrideDistribusi,
  kembalikanKeMabes,
  simpanSaranKabid,
} from "@/lib/gajamada/aksi-yanduan"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, ...args } = body

  try {
    let result
    switch (action) {
      case "override":
        result = await overrideDistribusi(args)
        break
      case "kembalikan":
        result = await kembalikanKeMabes(args)
        break
      case "saran":
        result = await simpanSaranKabid(args)
        break
      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
