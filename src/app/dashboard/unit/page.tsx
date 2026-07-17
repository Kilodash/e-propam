import { createServiceClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth/current-user"
import { redirect } from "next/navigation"
import { groupUnitsByNormalizedName, extractSearchKey } from "@/lib/unit-search"
import { getPoliceFunction, getPolresCasePositions, isSubbid } from "@/lib/auth/access"
import UnitDashboardClient from "@/components/dashboard/unit-dashboard-client"
import type { Pengaduan } from "@/types"

function orCaseOrPrevious(positions: string[]): string {
  return positions.map(p =>
    `case_position.eq."${p}",previous_case_position.eq."${p}"`
  ).join(",")
}

export default async function UnitDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const role = user.role

  if (role === "admin" || role === "yanduan" || role === "kabid") {
    return <p className="text-red-400 p-6">Halaman ini hanya untuk unit/subdit. Role Anda: {role}.</p>
  }

  const policeFn = getPoliceFunction(role as import("@/types").UserRole)
  if (!policeFn) {
    return <p className="text-red-400 p-6">Role tidak dikenali: {role}</p>
  }

  const supabase = createServiceClient()

  const { data: scopeUnits } = await supabase
    .from("unit_mapping")
    .select("gajamada_name")
    .eq("police_function", policeFn)
    .eq("is_active", true)

  const scopePositions = (scopeUnits ?? []).map((u: { gajamada_name: string }) => u.gajamada_name)

  let result: any

  // Determine if user is leadership (kasubbid/kasubbag) or regular unit member
  const isLeadership = user.unitName && /^KASUBBID|KASUBBAG|^KABID/i.test(user.unitName)

  if (role === "polres" && user.unitName) {
    const positions = await getPolresCasePositions(user.unitName)
    if (positions.length > 0) {
      result = await supabase.from("pengaduan").select("*").or(orCaseOrPrevious(positions)).order("created_date", { ascending: false })
    } else {
      result = await supabase.from("pengaduan").select("*").eq("disposisi_police_function", policeFn).order("created_date", { ascending: false })
    }
  } else if (!isLeadership && user.unitName) {
    // Regular unit member: only show their own unit
    result = await supabase.from("pengaduan").select("*")
      .or(`case_position.eq."${user.unitName}",previous_case_position.eq."${user.unitName}"`)
      .order("created_date", { ascending: false })
  } else if (scopePositions.length > 0) {
    result = await supabase.from("pengaduan").select("*").or(orCaseOrPrevious(scopePositions)).order("created_date", { ascending: false })
  } else {
    result = await supabase.from("pengaduan").select("*").eq("disposisi_police_function", policeFn).order("created_date", { ascending: false })
  }

  if (result.error) {
    return <p className="text-red-400 p-6">Gagal memuat data: {result.error.message}</p>
  }

  const list = (result.data as Pengaduan[]) ?? []

  const unitsQuery = supabase
    .from("unit_mapping")
    .select("gajamada_name, normalized_name, satker_level")
    .eq("is_active", true)

  if (isSubbid(role as import("@/types").UserRole)) {
    unitsQuery.eq("police_function", policeFn)
  } else if (role === "polres" && user.unitName) {
    const positions = await getPolresCasePositions(user.unitName)
    if (positions.length > 0) {
      unitsQuery.in("gajamada_name", positions)
    }
  }

  const { data: unitsData } = await unitsQuery
  const unitOptions = isSubbid(role as import("@/types").UserRole)
    ? (() => {
        const seen = new Map<string, { value: string; label: string; casePositions: string[] }>()
        for (const u of (unitsData ?? []) as any[]) {
          const name = u.gajamada_name.toUpperCase()
          let label: string

          if (name.startsWith("KASUBBID ")) {
            label = "KASUBBID " + policeFn
          } else if (name.startsWith("KAUR BINPAM") || name.startsWith("UR BINPAM")) {
            label = "UR BINPAM"
          } else if (name.startsWith("KAUR PRODOK") || name.startsWith("UR PRODOK")) {
            label = "UR PRODOK"
          } else if (name.startsWith("KAUR LITPERS") || name.startsWith("UR LITPERS")) {
            label = "UR LITPERS"
          } else if (name.startsWith("UNIT ")) {
            const m = name.match(/^UNIT\s+(\d+)\s+SUBBID/i)
            label = m ? `UNIT ${m[1]} SUBBID ${policeFn}` : extractSearchKey(name)
          } else {
            label = extractSearchKey(name)
          }

          if (!seen.has(label)) {
            seen.set(label, { value: u.gajamada_name, label, casePositions: [] })
          }
          seen.get(label)!.casePositions.push(u.gajamada_name)
        }
        // Order: leadership, then UR, then UNIT
        return Array.from(seen.values()).sort((a, b) => {
          const order = (s: string) =>
            s.startsWith("KASUBBID") ? 0 :
            s.startsWith("UR") ? 1 :
            s.startsWith("UNIT") ? 2 : 3
          return order(a.label) - order(b.label) || a.label.localeCompare(b.label)
        })
      })()
    : groupUnitsByNormalizedName((unitsData ?? []) as any[])

  const title = ""

  return (
    <UnitDashboardClient
      data={list}
      unitOptions={unitOptions}
      title={title}
      role={role}
      isLeadership={isLeadership}
    />
  )
}
