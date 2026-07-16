import { createServiceClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types"

const POLDA_CODE = 6013

const FUNCTION_MAP: Record<string, string> = {
  paminal: "PAMINAL",
  provos: "PROVOS",
  wabprof: "WABPROF",
  rehabpers: "REHABPERS",
  polres: "POLRES",
}

const ALL_ACCESS_ROLES: UserRole[] = ["admin", "yanduan", "kabid"]
const SUBBID_ROLES: UserRole[] = ["paminal", "provos", "wabprof", "rehabpers"]

export function hasAllAccess(role: UserRole): boolean {
  return ALL_ACCESS_ROLES.includes(role)
}

export function isSubbid(role: UserRole): boolean {
  return SUBBID_ROLES.includes(role)
}

export function getPoliceFunction(role: UserRole): string | null {
  return FUNCTION_MAP[role] ?? null
}

export async function getPolresCasePositions(normalizedName: string): Promise<string[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("unit_mapping")
    .select("gajamada_name")
    .eq("normalized_name", normalizedName)
    .eq("is_active", true)
  return (data ?? []).map((r: { gajamada_name: string }) => r.gajamada_name)
}

/**
 * Build Supabase .or() filter string for case_position OR previous_case_position.
 */
function positionsOrFilter(positions: string[]): string {
  return positions.map(p => `case_position.eq.${encodeURIComponent(p)},previous_case_position.eq.${encodeURIComponent(p)}`).join(",")
}

export async function fetchDataForRole(role: UserRole, normalizedName?: string) {
  const supabase = createServiceClient()

  if (hasAllAccess(role)) {
    return supabase
      .from("pengaduan")
      .select("*")
      .eq("polda_code", POLDA_CODE)
      .order("created_date", { ascending: false })
  }

  const policeFn = getPoliceFunction(role)
  if (policeFn) {
    if (role === "polres") {
      if (normalizedName) {
        const positions = await getPolresCasePositions(normalizedName)
        if (positions.length > 0) {
          return supabase
            .from("pengaduan")
            .select("*")
            .or(positionsOrFilter(positions))
            .order("created_date", { ascending: false })
        }
      }
      return supabase
        .from("pengaduan")
        .select("*")
        .eq("disposisi_police_function", policeFn)
        .order("created_date", { ascending: false })
    }

    return supabase
      .from("pengaduan")
      .select("*")
      .eq("disposisi_police_function", policeFn)
      .order("created_date", { ascending: false })
  }

  return supabase.from("pengaduan").select("*").eq("polda_code", POLDA_CODE)
}

export async function fetchUnitOptionsForRole(role: UserRole) {
  const supabase = createServiceClient()
  const policeFn = getPoliceFunction(role)
  const query = supabase.from("unit_mapping").select("gajamada_name, normalized_name, satker_level").eq("is_active", true)
  if (policeFn && isSubbid(role)) {
    query.eq("police_function", policeFn)
  }
  return query
}
