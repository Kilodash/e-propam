import { cache } from "react"
import { createServiceClient } from "@/lib/supabase/server"

let _cached: { data: any[]; ts: number } | null = null
const TTL = 60000 // 60 detik

export function invalidateCache() {
  _cached = null
}

async function getPengaduanCached() {
  const now = Date.now()
  if (_cached && (now - _cached.ts) < TTL) return _cached.data

  const supabase = createServiceClient()
  const result = await supabase
    .from("pengaduan")
    .select("*")
    .eq("polda_code", 6013)
    .order("updated_at", { ascending: false })

  if (result.error) return []
  _cached = { data: result.data ?? [], ts: now }
  return _cached.data
}

async function getUnitsCached() {
  const supabase = createServiceClient()
  const result = await supabase
    .from("unit_mapping")
    .select("gajamada_name, normalized_name, satker_level")
    .eq("is_active", true)
  return result.data ?? []
}

export const getYanduanData = cache(async () => {
  const [pengaduan, units] = await Promise.all([getPengaduanCached(), getUnitsCached()])
  return { pengaduan, units }
})
