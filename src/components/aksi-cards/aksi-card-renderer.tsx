"use client"

import { useEffect, useState } from "react"
import { aksiCardRegistry } from "@/lib/aksi-cards/registry"
import { groupUnitsByNormalizedName, type UnitFilterOption } from "@/lib/unit-search"
import type { Pengaduan } from "@/types"
import type { CardLayoutConfig } from "@/lib/aksi-cards/types"

const ROLE_POLICE_FN: Record<string, string> = {
  paminal: "PAMINAL",
  provos: "PROVOS",
  wabprof: "WABPROF",
  rehabpers: "REHABPERS",
  polres: "POLRES",
}

const ROLE_SELF_EXCLUDE: Record<string, RegExp> = {
  kabid: /KABID PROPAM/i,
  paminal: /KASUBBID PAMINAL/i,
  provos: /KASUBBID PROVOS/i,
  wabprof: /KASUBBID WABPROF/i,
  rehabpers: /KASUBBAG REHABPERS/i,
  yanduan: /KASUBBAG YANDUAN|OPERATOR YANDUAN/i,
}

const ROLE_OWN_POSITIONS: Record<string, string[]> = {
  yanduan: ["KASUBBAG YANDUAN POLDA JAWA BARAT", "OPERATOR YANDUAN POLDA JAWA BARAT"],
  admin: ["KABID PROPAM POLDA JAWA BARAT"],
  kabid: ["KABID PROPAM POLDA JAWA BARAT"],
  paminal: ["KASUBBID PAMINAL POLDA JAWA BARAT"],
  provos: ["KASUBBID PROVOS POLDA JAWA BARAT"],
  wabprof: ["KASUBBID WABPROF POLDA JAWA BARAT"],
  rehabpers: ["KASUBBAG REHABPERS POLDA JAWA BARAT"],
}

const PREFIX_ORDER: Record<string, number> = {
  KASUBBID: 1, KASUBBAG: 1, KABID: 0,
  KAUR: 2, UR: 3, UNIT: 4, KANIT: 5, OPERATOR: 6,
}

function prefixSort(a: any, b: any): number {
  const getOrder = (name: string) => {
    const prefix = name?.split(" ")[0] || "Z"
    return PREFIX_ORDER[prefix] ?? 99
  }
  const oa = getOrder(a.gajamada_name || a.label)
  const ob = getOrder(b.gajamada_name || b.label)
  if (oa !== ob) return oa - ob
  return (a.gajamada_name || a.label || "").localeCompare(b.gajamada_name || b.label || "")
}

interface Props {
  role: string
  pengaduanId: string
  prepetratorId: string
  pengaduan: Pengaduan
}

function filterByPoliceFn(units: any[], policeFn: string): any[] {
  return units.filter(u => u.police_function === policeFn)
}

export default function AksiCardRenderer({ role, pengaduanId, prepetratorId, pengaduan }: Props) {
  const [unitOptions, setUnitOptions] = useState<UnitFilterOption[]>([])
  const [configs, setConfigs] = useState<CardLayoutConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/card-layout?role=${encodeURIComponent(role)}`).then(r => r.json()),
      fetch("/api/units").then(r => r.json()),
    ])
      .then(([layoutJson, unitsJson]) => {
        const allConfigs = (layoutJson.data ?? []) as CardLayoutConfig[]
        const enabled = allConfigs.filter(c => c.enabled !== false)
        setConfigs(enabled)
        let units = unitsJson.data ?? []
        units = excludeSelf(units, role)
        const policeFn = ROLE_POLICE_FN[role]
        if (policeFn) {
          units = filterByPoliceFn(units, policeFn)
          const sorted = units
            .map((u: any) => ({
              value: u.gajamada_name,
              label: u.gajamada_name,
              casePositions: [u.gajamada_name],
            }))
            .sort(prefixSort)
          setUnitOptions(sorted)
        } else {
          setUnitOptions(groupUnitsByNormalizedName(units))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [role])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (configs.length === 0) {
    return <p className="text-gray-400 text-xs text-center py-4">Tidak ada aksi tersedia</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {configs.map(cfg => {
        const def = aksiCardRegistry[cfg.cardId]
        if (!def) return null

        // Distribusi card: disabled when case_position is not user's own
        let isDisabled = false
        if (cfg.cardId === "distribusi") {
          const ownPositions = ROLE_OWN_POSITIONS[role] || []
          if (ownPositions.length > 0 && pengaduan.case_position && !ownPositions.includes(pengaduan.case_position)) {
            isDisabled = true
          }
        }

        const Component = def.component
        const componentProps: any = {
          role,
          pengaduanId,
          prepetratorId,
          pengaduan,
          unitOptions,
          config: cfg.config,
        }
        if (cfg.cardId === "distribusi") {
          componentProps.disabled = isDisabled
        }
        return (
          <div key={cfg.cardId} className="shrink-0">
            <Component {...componentProps} />
          </div>
        )
      })}
    </div>
  )
}
