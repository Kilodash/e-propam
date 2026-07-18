const STATIONARY_KEYS = new Set([
  "KASUBBID PAMINAL POLDA JAWA BARAT",
  "KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT",
  "KABID PROPAM POLDA JAWA BARAT",
  "KABIDPROPAM POLDA JAWA BARAT",
  "BID PROPAM POLDA JAWA BARAT",
  "BIDPROPAM POLDA JAWA BARAT",
])

export type SatkerKey = "PAMINAL" | "KABIDPROPAM" | string

export function unitToSatkerKey(gajamadaName: string): SatkerKey {
  const n = (gajamadaName || "").toUpperCase().trim()
  if (!n) return "UNKNOWN"
  if (STATIONARY_KEYS.has(n) || /PAMINAL/.test(n)) return "PAMINAL"
  if (/(KABID|BID)\s*PROPAM/.test(n)) return "KABIDPROPAM"
  return n
}
