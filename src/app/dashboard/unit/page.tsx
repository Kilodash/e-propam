import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"
import { groupUnitsByNormalizedName } from "@/lib/unit-search"
import { getPoliceFunction, getPolresCasePositions, isSubbid } from "@/lib/auth/access"
import UnitDashboardClient from "@/components/dashboard/unit-dashboard-client"
import type { Pengaduan, UserRole } from "@/types"

export default async function UnitDashboardPage() {
  const c = await cookies()
  const role = (c.get("dev-role")?.value ?? "paminal") as UserRole
  const devUnit = c.get("dev-unit")?.value ?? undefined

  if (role === "admin" || role === "yanduan" || role === "kabid") {
    return <p className="text-red-400 p-6">Halaman ini hanya untuk unit/subdit. Role Anda: {role}.</p>
  }

  const policeFn = getPoliceFunction(role)
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

  if (role === "polres" && devUnit) {
    const positions = await getPolresCasePositions(devUnit)
    if (positions.length > 0) {
      result = await supabase.from("pengaduan").select("*").in("case_position", positions).order("created_date", { ascending: false })
    } else {
      result = await supabase.from("pengaduan").select("*").eq("disposisi_police_function", policeFn).order("created_date", { ascending: false })
    }
  } else if (scopePositions.length > 0) {
    result = await supabase.from("pengaduan").select("*").in("case_position", scopePositions).order("created_date", { ascending: false })
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

  if (isSubbid(role)) {
    unitsQuery.eq("police_function", policeFn)
  } else if (role === "polres" && devUnit) {
    const positions = await getPolresCasePositions(devUnit)
    if (positions.length > 0) {
      unitsQuery.in("gajamada_name", positions)
    }
  }

  const { data: unitsData } = await unitsQuery
  const unitOptions = isSubbid(role)
    ? ((unitsData ?? []) as any[]).map((u: any) => ({
        value: u.gajamada_name,
        label: u.gajamada_name,
        casePositions: [u.gajamada_name],
      })).sort((a: any, b: any) => {
        const order: Record<string, number> = { KASUBBID: 1, KASUBBAG: 1, KABID: 0, KAUR: 2, UR: 3, UNIT: 4, KANIT: 5, OPERATOR: 6 }
        const pa = a.label?.split(" ")[0] || "Z"
        const pb = b.label?.split(" ")[0] || "Z"
        return (order[pa] ?? 99) - (order[pb] ?? 99) || a.label.localeCompare(b.label)
      })
    : groupUnitsByNormalizedName((unitsData ?? []) as any[])

  const title = devUnit ? `Dashboard Unit — ${devUnit}` : `Dashboard Unit — ${policeFn}`

  return (
    <UnitDashboardClient
      data={list}
      unitOptions={unitOptions}
      title={title}
      role={role}
    />
  )
}
