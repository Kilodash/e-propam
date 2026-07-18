"use server"

import { createServiceClient } from "@/lib/supabase/server"

const SATKER_ORDER: Record<string, number> = {
  kabid: 0, subbid: 1, subbag: 2, tabes: 3, polres: 4, brimob: 5, ditpolair: 6, wassidik: 7,
}

function computeSortOrder(level: string): number {
  return SATKER_ORDER[level] ?? 99
}

interface UnitSeed {
  gajamada_name: string
  normalized_name: string
  police_function: string | null
  satker_level: string
  sort_order: number
}

function detectUnit(gajamadaName: string): UnitSeed {
  const upper = gajamadaName.toUpperCase()

  if (upper.includes("KABID PROPAM")) {
    return { gajamada_name: gajamadaName, normalized_name: "Kabid Propam", police_function: null, satker_level: "kabid", sort_order: computeSortOrder("kabid") }
  }
  if (upper.includes("YANDUAN")) {
    return { gajamada_name: gajamadaName, normalized_name: "Subbag Yanduan", police_function: "YANDUAN", satker_level: "subbag", sort_order: computeSortOrder("subbag") }
  }
  if (upper.includes("REHABPERS")) {
    return { gajamada_name: gajamadaName, normalized_name: "Subbag Rehabpers", police_function: "REHABPERS", satker_level: "subbag", sort_order: computeSortOrder("subbag") }
  }
  if (upper.includes("PAMINAL")) {
    return { gajamada_name: gajamadaName, normalized_name: "Subbid Paminal", police_function: "PAMINAL", satker_level: "subbid", sort_order: computeSortOrder("subbid") }
  }
  if (upper.includes("PROVOS") && !upper.includes("SIPROVOS")) {
    return { gajamada_name: gajamadaName, normalized_name: "Subbid Provos", police_function: "PROVOS", satker_level: "subbid", sort_order: computeSortOrder("subbid") }
  }
  if (upper.includes("WABPROF")) {
    return { gajamada_name: gajamadaName, normalized_name: "Subbid Wabprof", police_function: "WABPROF", satker_level: "subbid", sort_order: computeSortOrder("subbid") }
  }
  if (upper.includes("SATBRIMOB")) {
    return { gajamada_name: gajamadaName, normalized_name: "Satbrimob", police_function: "PROVOS", satker_level: "brimob", sort_order: computeSortOrder("brimob") }
  }
  if (upper.includes("DITPOLAIR")) {
    return { gajamada_name: gajamadaName, normalized_name: "Ditpolair", police_function: "POLAIR", satker_level: "ditpolair", sort_order: computeSortOrder("ditpolair") }
  }
  if (upper.includes("WASSIDIK")) {
    return { gajamada_name: gajamadaName, normalized_name: detectWassidik(upper), police_function: "WASSIDIK", satker_level: "wassidik", sort_order: computeSortOrder("wassidik") }
  }
  if (upper.includes("AKREDITOR")) {
    return { gajamada_name: gajamadaName, normalized_name: detectAkreditor(upper), police_function: "POLRES", satker_level: "polres", sort_order: computeSortOrder("polres") }
  }
  if (upper.includes("POLRESTABES")) {
    return detectPolres(gajamadaName, "tabes")
  }
  if (upper.includes("POLRESTA")) {
    return detectPolres(gajamadaName, "polres")
  }
  if (upper.includes("POLRES")) {
    return detectPolres(gajamadaName, "polres")
  }
  if (upper.includes("SIPROVOS")) {
    // SIPROVOS pattern → likely related to Provos
    return { gajamada_name: gajamadaName, normalized_name: "Subbid Provos", police_function: "PROVOS", satker_level: "subbid", sort_order: computeSortOrder("subbid") }
  }

  return { gajamada_name: gajamadaName, normalized_name: gajamadaName, police_function: null, satker_level: "polres", sort_order: computeSortOrder("polres") }
}

function detectPolres(gajamadaName: string, level: "tabes" | "polres"): UnitSeed {
  const upper = gajamadaName.toUpperCase()
  const prefix = level === "tabes" ? "POLRESTABES" : "POLRESTA"
  const isPolresta = upper.includes("POLRESTA") && !upper.includes("POLRESTABES")

  let location = ""
  if (upper.includes("POLRESTABES")) {
    location = extractAfter(upper, "POLRESTABES")
  } else if (isPolresta) {
    location = extractAfter(upper, "POLRESTA")
  } else {
    location = extractAfter(upper, "POLRES")
  }

  location = location.replace(/\s+POLDA\s+JAWA\s+BARAT$/i, "").trim()
  const normalized = capitalizeWords((level === "tabes" ? "Polrestabes " : isPolresta ? "Polresta " : "Polres ") + location)

  return {
    gajamada_name: gajamadaName,
    normalized_name: normalized,
    police_function: "POLRES",
    satker_level: level,
    sort_order: computeSortOrder(level),
  }
}

function extractAfter(str: string, keyword: string): string {
  const idx = str.indexOf(keyword)
  if (idx === -1) return str
  return str.substring(idx + keyword.length).trim()
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function detectWassidik(upper: string): string {
  if (upper.includes("DITRESKRIMUM")) return "Wassidik Ditreskrim Um"
  if (upper.includes("DITRESKRIMSUS")) return "Wassidik Ditreskrim Sus"
  if (upper.includes("DITRESNARKOBA")) return "Wassidik Ditresnarkoba"
  if (upper.includes("DITRESSIBER")) return "Wassidik Ditressiber"
  if (upper.includes("PPA") || upper.includes("PPO")) return "Wassidik Ditres PPA/PPO"
  return "Wassidik"
}

function detectAkreditor(upper: string): string {
  if (upper.includes("PANGANDARAN")) return "Akreditor Pangandaran"
  if (upper.includes("BANDUNG")) return "Akreditor Bandung"
  return "Akreditor"
}

export async function buildUnitMapping(): Promise<void> {
  const supabase = createServiceClient()

  const { data: pengaduan, error: pengErr } = await supabase
    .from("pengaduan")
    .select("case_position")

  if (pengErr || !pengaduan) return

  const uniquePositions: string[] = [...new Set(pengaduan.map((p: { case_position: string | null }) => p.case_position).filter(Boolean) as string[])]

  if (uniquePositions.length === 0) return

  const { data: existing } = await supabase
    .from("unit_mapping")
    .select("gajamada_name")

  const existingNames = new Set((existing ?? []).map((e: { gajamada_name: string }) => e.gajamada_name))

  const newUnits = uniquePositions
    .filter(name => !existingNames.has(name!))
    .map(name => detectUnit(name!))

  if (newUnits.length === 0) return

  const toInsert = newUnits.map(({ gajamada_name, normalized_name, police_function, satker_level }) => ({
    gajamada_name,
    normalized_name,
    police_function,
    satker_level,
  }))

  const { error } = await supabase.from("unit_mapping").insert(toInsert)
  if (error) {
    console.error("buildUnitMapping insert error:", error.message)
  }

  // Check if any newly detected units match manual units with fallback_position
  const { data: manualWithFallback } = await supabase
    .from("unit_mapping")
    .select("gajamada_name, fallback_position")
    .not("fallback_position", "is", null)

  if (manualWithFallback?.length) {
    const justAdded = new Set(toInsert.map(u => u.gajamada_name))
    const matched = manualWithFallback.filter((m: { gajamada_name: string }) => justAdded.has(m.gajamada_name))
    if (matched.length > 0) {
      const names = matched.map((m: { gajamada_name: string }) => m.gajamada_name).join(", ")
      await supabase.from("sync_log").insert({
        direction: "inbound",
        status: "success",
        records_count: 0,
        error_message: `[INFO] Manual units now exist in Gajamada — remove fallback_position from: ${names}`,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
      console.log(`buildUnitMapping: manual units now in Gajamada: ${names}`)
    }
  }
}
