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
    .trim()
  // Handle "SUBBID PAMINAL" → "PAMINAL"
  return key.startsWith("SUBBID ") ? key.replace("SUBBID ", "") : key
}

/**
 * Custom sort order for satker levels in combobox.
 */
export const SATKER_ORDER: Record<string, number> = {
  subbid: 1, subbag: 2, tabes: 3, polres: 4, brimob: 5, ditpolair: 6, wassidik: 7,
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
