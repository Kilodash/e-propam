import { NextRequest, NextResponse } from "next/server"
import { getCookie as getGajamadaCookie } from "@/lib/gajamada/client"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get("url")
  const filename = searchParams.get("filename") ?? "lampiran"
  const forceDownload = searchParams.get("download") === "1"

  if (!rawUrl) {
    return NextResponse.json({ error: "url required" }, { status: 400 })
  }

  try {
    const gajamadaCookie = await getGajamadaCookie().catch(() => undefined)

    const fetchUrl = rawUrl.startsWith("http") ? rawUrl : `${process.env.GAJAMADA_BASE_URL || "https://gajamada-propam.polri.go.id"}${rawUrl}`

    const res = await fetch(fetchUrl, {
      headers: {
        Accept: "*/*",
        ...(gajamadaCookie ? { Cookie: gajamadaCookie } : {}),
      },
      redirect: "follow",
    })

    if (!res.ok) {
      console.error(`Download proxy failed: ${res.status} for ${rawUrl.substring(0, 80)}`)
      return new NextResponse(`Gagal mengunduh (${res.status}). File mungkin tidak tersedia.`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    const buffer = await res.arrayBuffer()
    const responseContentType = res.headers.get("content-type") ?? "application/octet-stream"
    
    // Try to extract original filename from Content-Disposition header
    const cdHeader = res.headers.get("content-disposition") ?? ""
    const cdMatch = cdHeader.match(/filename[*]?=(?:UTF-8''|"?)([^";]+)/i)
    const originalName = cdMatch ? decodeURIComponent(cdMatch[1]) : filename
    const safeName = originalName || filename

    const disposition = forceDownload
      ? `attachment; filename="${encodeURIComponent(safeName)}"`
      : `inline; filename="${encodeURIComponent(safeName)}"`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": responseContentType,
        "Content-Disposition": disposition,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-cache",
      },
    })
  } catch (e: any) {
    console.error("Download proxy error:", e.message)
    return new NextResponse(`Gagal mengunduh: ${e.message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
