"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface UnitOption {
  value: string
  label: string
}

const ROLE_POLICE_FN_MAP: Record<string, string> = {
  paminal: "PAMINAL",
  provos: "PROVOS",
  wabprof: "WABPROF",
  rehabpers: "REHABPERS",
}

export default function DevUnitSwitcher() {
  const [units, setUnits] = useState<UnitOption[]>([])
  const [role, setRole] = useState("")
  const router = useRouter()

  useEffect(() => {
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=")
      acc[k] = v
      return acc
    }, {} as Record<string, string>)
    setRole(cookies["dev-role"] ?? "")
  }, [])

  useEffect(() => {
    if (!role) return
    const policeFn = ROLE_POLICE_FN_MAP[role]
    if (!policeFn && role !== "polres") return
    fetch("/api/units")
      .then(r => r.json())
      .then(json => {
        const data = (json.data ?? []) as any[]
        const filtered = policeFn
          ? data.filter((u: any) => u.police_function === policeFn)
          : data
        setUnits(filtered.map((u: any) => ({
          value: u.gajamada_name,
          label: u.gajamada_name,
        })).sort((a: any, b: any) => a.label.localeCompare(b.label)))
      })
      .catch(() => {})
  }, [role])

  if (units.length === 0) return null

  function selectUnit(unitName: string) {
    document.cookie = `dev-unit=${encodeURIComponent(unitName)};path=/;max-age=86400`
    router.refresh()
  }

  return (
    <select
      className="bg-[#1e293b] border border-gray-600 text-gray-200 text-xs px-2 py-1 rounded"
      onChange={(e) => selectUnit(e.target.value)}
      defaultValue=""
    >
      <option value="" disabled>Pilih Unit</option>
      {units.map(u => (
        <option key={u.value} value={u.value}>{u.label}</option>
      ))}
    </select>
  )
}
