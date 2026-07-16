import { NextRequest, NextResponse } from "next/server"
import { getCookie as getGajamadaCookie } from "@/lib/gajamada/client"

const GAJAMADA_BASE = process.env.GAJAMADA_BASE_URL || "https://gajamada-propam.polri.go.id"

function encodeUrl(raw: string): string {
  try {
    new URL(raw)
    return raw
  } catch {
    const idx = raw.indexOf("/", 8)
    if (idx === -1) return raw
    return raw.substring(0, idx) + encodeURI(raw.substring(idx))
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawUrl = searchParams.get("url")
  const filename = searchParams.get("filename") ?? "lampiran"
  const forceDownload = searchParams.get("download") === "1"

  if (!rawUrl) {
    return NextResponse.json({ error: "url required" }, { status: 400 })
  }

  try {
    const cookie = await getGajamadaCookie().catch(() => "")

    const encoded = encodeUrl(rawUrl)
    let fetchUrl = encoded

    const u = new URL(encoded)
    if (u.hostname === "yanduan-s3.polri.go.id" && u.pathname.startsWith("/fusion/agent/")) {
      const key = decodeURIComponent(u.pathname.replace("/fusion/agent/", ""))
      fetchUrl = `${GAJAMADA_BASE}/cdn/media/fusion/agent/${key}`
    }

    const headers: Record<string, string> = {
      "Accept": "*/*",
      "Origin": GAJAMADA_BASE,
      "Referer": `${GAJAMADA_BASE}/report/laporan-pengaduan`,
    }
    if (cookie) headers["Cookie"] = cookie

    const res = await fetch(fetchUrl, { headers, redirect: "follow" })

    if (!res.ok) {
      return new NextResponse(`Gagal mengunduh (${res.status})`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get("content-type") || "application/octet-stream"

    const cdHeader = res.headers.get("content-disposition") ?? ""
    const cdMatch = cdHeader.match(/filename[*]?=(?:UTF-8''|"?)([^";]+)/i)
    const name = cdMatch ? decodeURIComponent(cdMatch[1]) : filename

    const disposition = forceDownload
      ? `attachment; filename="${encodeURIComponent(name)}"`
      : `inline; filename="${encodeURIComponent(name)}"`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (e: any) {
    return new NextResponse(`Gagal mengunduh: ${e.message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
