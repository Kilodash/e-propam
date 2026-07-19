import { NextResponse } from "next/server"
import { getCookie } from "@/lib/gajamada/client"

export const dynamic = "force-dynamic"

const connectionId = "245b8fd7c4a763019d5172fad5ec0086"
const dashboardId = "1769155096865"

interface CatalogOptions {
  value: string
  label: string
  category?: string
  sub_category?: string
}

let cachedCatalog: { data: Record<string, any>; cachedAt: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minit

async function fetchGajamadaTable(table: string, orderBy: string): Promise<Record<string, any>[]> {
  const cookie = await getCookie()
  const res = await fetch(`https://gajamada-propam.polri.go.id/api/v1/apps/data/management/get-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookie },
    body: JSON.stringify({
      orderBy, order: "asc", page: 1, size: 1000,
      connectionId, table, database: "divpropam", filters: [],
    }),
  })
  if (!res.ok) throw new Error(`${table}: ${res.status}`)
  const json = await res.json()
  return (json.data?.records ?? json.data ?? []) as Record<string, any>[]
}

export async function GET() {
  if (cachedCatalog && Date.now() - cachedCatalog.cachedAt < CACHE_TTL) {
    return NextResponse.json({ success: true, data: cachedCatalog.data })
  }

  try {
    const [pangkatList, kategoriList, pasalList, kesatuanList, functionList] = await Promise.all([
      fetchGajamadaTable("dimension.catalog_pangkat", "pangkat"),
      fetchGajamadaTable("dimension.catalog_kategori_perbuatan", "kategori"),
      fetchGajamadaTable("dimension.catalog_pasal", "kode_pasal"),
      fetchGajamadaTable("dimension.catalog_kesatuan_terlapor", "polda_name"),
      fetchGajamadaTable("dimension.catalog_function", "function"),
    ])

    const pangkat = pangkatList.map((r: any) => ({
      value: r.pangkat || r.name || "",
      label: r.pangkat || r.name || "",
    }))

    const kategori = kategoriList.map((r: any) => ({
      value: r.kategori || r.name || "",
      label: r.kategori || r.name || "",
      sub_kategori: r.sub_kategori || "",
      wujud_perbuatan: r.wujud_perbuatan || "",
    }))

    const pasal = pasalList.map((r: any) => {
      const type = r.type || ""
      const code = r.kode_pasal || r.name || ""
      const desc = r.description || r.raw_pasal || ""
      const shortType = type.includes("PERPOL") ? "KEPP"
        : type.includes("PPRI") && type.includes("1") ? "PP1"
        : type.includes("PPRI") && type.includes("2") ? "PP2"
        : type.includes("PPRI") && type.includes("94") ? "PP94"
        : type || ""
      return { value: `${code} (${shortType})`, label: `[${shortType}] ${code} — ${desc || code}`.substring(0, 120), type, id: r.id, code }
    })

    const kesatuan = kesatuanList
      .map((r: any) => ({ value: r.polda_name || "", label: r.polda_name || "" }))

    const wujudMap = new Map<string, { value: string; label: string; kategori: string; sub_kategori: string }>()
    kategori.forEach(k => {
      if (k.wujud_perbuatan && !wujudMap.has(k.wujud_perbuatan)) {
        wujudMap.set(k.wujud_perbuatan, { value: k.wujud_perbuatan, label: k.wujud_perbuatan, kategori: k.value, sub_kategori: k.sub_kategori || "" })
      }
    })

    const functional = functionList.map((r: any) => ({
      value: r.function || r.name || "",
      label: r.function || r.name || "",
    }))

    cachedCatalog = { data: { pangkat, kategori, pasal, kesatuan, functional, wujud: [...wujudMap.values()] }, cachedAt: Date.now() }
    return NextResponse.json({ success: true, data: cachedCatalog.data })
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 502 })
  }
}
