/**
 * Extract search key from Gajamada unit name for hierarchical filtering.
 * Removes jabatan prefix and POLDA suffix, leaving only the unit identifier.
 *
 * Examples:
 *   KASUBBID PAMINAL POLDA JAWA BARAT → PAMINAL
 *   KASIPROPAM POLRESTA BANDUNG POLDA JAWA BARAT → POLRESTA BANDUNG
 *   KASIPROPAM POLRES SUKABUMI POLDA JAWA BARAT → POLRES SUKABUMI
 *   KASIPROVOS SATBRIMOB POLDA JAWA BARAT → SATBRIMOB
 *   WASSIDIK DITRESKRIMUM POLDA JAWA BARAT → WASSIDIK DITRESKRIMUM
 */

const PREFIX_PATTERN = new RegExp(
  "^KASUBBID |^KASUBBAG |^KASIPROPAM |^KASIPROVOS |^KANIT PAMINAL |^KANIT PROVOS |^KANIT WABPROF |^KAUR YANDUAN |^OPERATOR YANDUAN |^UNIT \\d+ ",
  "i"
)

export function extractSearchKey(gajamadaName: string): string {
  const key = gajamadaName
    .toUpperCase()
    .replace(PREFIX_PATTERN, "")
    .replace(/\s+POLDA\s+JAWA\s+BARAT$/i, "")
    .replace(/\s+JAWA\s+BARAT$/i, "")
    .replace(/^SUBBID\s+/, "")
    .trim()
  return key
}

/**
 * Custom sort order for satker levels in combobox.
 */
export const SATKER_ORDER: Record<string, number> = {
  kabid: 0, subbid: 1, subbag: 2, tabes: 3, polres: 4, brimob: 5, ditpolair: 6, wassidik: 7,
}

export function sortUnits(units: { gajamada_name: string; normalized_name: string; satker_level: string }[]) {
  return [...units].sort((a, b) => {
    const oa = SATKER_ORDER[a.satker_level] ?? 99
    const ob = SATKER_ORDER[b.satker_level] ?? 99
    if (oa !== ob) return oa - ob
    const ta = a.normalized_name.startsWith("Polresta") ? 10 : 20
    const tb = b.normalized_name.startsWith("Polresta") ? 10 : 20
    if (ta !== tb) return ta - tb
    return a.normalized_name.localeCompare(b.normalized_name, "id")
  })
}

export interface UnitFilterOption {
  value: string
  label: string
  casePositions: string[]
  group?: string
}

/**
 * Group unit_mapping by normalized_name. Each group gets one dropdown entry
 * whose casePositions array contains all associated gajamada_name values.
 * Filtering selects pengaduan where case_position matches ANY of the casePositions.
 */
export function groupUnitsByNormalizedName(
  units: { gajamada_name: string; normalized_name: string; satker_level: string }[]
): UnitFilterOption[] {
  const sorted = sortUnits(units)
  const seen = new Map<string, UnitFilterOption>()

  for (const u of sorted) {
    const key = u.normalized_name
    if (!seen.has(key)) {
      seen.set(key, { value: u.gajamada_name, label: u.normalized_name, casePositions: [] })
    }
    seen.get(key)!.casePositions.push(u.gajamada_name)
  }

  return Array.from(seen.values())
}

/**
 * Build hierarchical unit options for subbid (Paminal/Provos/Wabprof).
 * Returns flat list but with `group` field indicating the parent group label.
 *
 * Examples:
 *   KASUBBID PAMINAL POLDA JAWA BARAT        → standalone (no group)
 *   KAUR BINPAM SUBBID PAMINAL              → group: BINPAM
 *   UR BINPAM SUBBID PAMINAL                → group: BINPAM
 *   KAUR LITPERS SUBBID PAMINAL             → group: LITPERS
 *   UR LITPERS SUBBID PAMINAL               → group: LITPERS
 *   UNIT 1 SUBBID PAMINAL                   → standalone
 */
export function buildSubbidHierarchy(
  units: { gajamada_name: string; normalized_name: string; satker_level: string }[]
): UnitFilterOption[] {
  const result: UnitFilterOption[] = []

  // Group entries by their function (BINPAM, LITPERS, PRODOK, UNIT, etc.)
  const byFunction = new Map<string, typeof units>()
  const standalone: typeof units = []

  for (const u of units) {
    const name = u.gajamada_name.toUpperCase()
    // Leadership
    if (name.startsWith("KASUBBID ") || name.startsWith("KASUBBAG ")) {
      result.push({
        value: u.gajamada_name,
        label: "◆ " + extractSearchKey(u.gajamada_name),
        casePositions: [u.gajamada_name],
        group: "__leadership__",
      })
      continue
    }
    // Detect function name (BINPAM, LITPERS, PRODOK, etc.)
    const funcMatch = name.match(/^(KAUR|UR|UNIT)\s+([A-Z]+(?:\s+[A-Z]+)?)\s+SUBBID/i)
    if (funcMatch) {
      const fn = funcMatch[2].trim()
      if (!byFunction.has(fn)) byFunction.set(fn, [])
      byFunction.get(fn)!.push(u)
    } else {
      standalone.push(u)
    }
  }

  // For each function group, create header + child entries
  const sortedFns = Array.from(byFunction.keys()).sort()
  for (const fn of sortedFns) {
    const members = byFunction.get(fn)!
    // Header entry (acts as visual section label — non-selectable)
    result.push({
      value: `__group_${fn}__`,
      label: `▸ ${fn}`,
      casePositions: [],
      group: fn,
    })
    // Sort members: KAUR, UR, then others
    const roleOrder: Record<string, number> = { KAUR: 1, UR: 2, UNIT: 3 }
    members.sort((a, b) => {
      const ra = a.gajamada_name.split(" ")[0] || "Z"
      const rb = b.gajamada_name.split(" ")[0] || "Z"
      return (roleOrder[ra] ?? 99) - (roleOrder[rb] ?? 99) || a.gajamada_name.localeCompare(b.gajamada_name)
    })
    for (const m of members) {
      result.push({
        value: m.gajamada_name,
        label: "    " + extractSearchKey(m.gajamada_name),
        casePositions: [m.gajamada_name],
        group: fn,
      })
    }
  }

  // Standalone units (UNIT 1, UNIT 2, etc.) at the end
  for (const u of standalone) {
    result.push({
      value: u.gajamada_name,
      label: extractSearchKey(u.gajamada_name),
      casePositions: [u.gajamada_name],
    })
  }

  return result
}
