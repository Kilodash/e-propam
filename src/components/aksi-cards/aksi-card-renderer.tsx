"use client"

import { useEffect, useState, useCallback } from "react"
import { GripVertical } from "lucide-react"
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
  isLeadership?: boolean
}

function excludeSelf(units: any[], role: string): any[] {
  const pattern = ROLE_SELF_EXCLUDE[role]
  if (!pattern) return units
  return units.filter((u: any) => !pattern.test(u.gajamada_name || u.label))
}

function filterByPoliceFn(units: any[], policeFn: string): any[] {
  return units.filter(u => u.police_function === policeFn)
}

function getStorageKey(role: string, isLeadership?: boolean): string {
  return `card_order_${role}_${isLeadership ? "leadership" : "unit"}`
}

function loadSavedOrder(role: string, isLeadership?: boolean): string[] | null {
  try {
    const key = getStorageKey(role, isLeadership)
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function saveOrder(order: string[], role: string, isLeadership?: boolean) {
  try {
    const key = getStorageKey(role, isLeadership)
    localStorage.setItem(key, JSON.stringify(order))
  } catch {}
}

export default function AksiCardRenderer({ role, pengaduanId, prepetratorId, pengaduan, isLeadership }: Props) {
  const [unitOptions, setUnitOptions] = useState<UnitFilterOption[]>([])
  const [configs, setConfigs] = useState<CardLayoutConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/card-layout?role=${encodeURIComponent(role)}${isLeadership ? "&userScope=leadership" : "&userScope=unit"}`).then(r => r.json()),
      fetch("/api/units").then(r => r.json()),
    ])
      .then(([layoutJson, unitsJson]) => {
        const allConfigs = (layoutJson.data ?? []) as CardLayoutConfig[]
        let enabled = allConfigs.filter(c => c.enabled !== false)

        // Apply saved order from localStorage
        const savedOrder = loadSavedOrder(role, isLeadership)
        if (savedOrder && savedOrder.length > 0) {
          const orderMap = new Map(savedOrder.map((id, i) => [id, i]))
          enabled = [...enabled].sort((a, b) => {
            const ai = orderMap.has(a.cardId) ? orderMap.get(a.cardId)! : 999
            const bi = orderMap.has(b.cardId) ? orderMap.get(b.cardId)! : 999
            return ai - bi
          })
        }

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
  }, [role, isLeadership])

  const handleDragStart = useCallback((idx: number, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(idx))
    setDragIdx(idx)
  }, [])

  const handleDragOver = useCallback((idx: number, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setOverIdx(idx)
  }, [])

  const handleDrop = useCallback((targetIdx: number, e: React.DragEvent) => {
    e.preventDefault()
    const fromIdx = dragIdx
    if (fromIdx === null || fromIdx === targetIdx) return

    setConfigs(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(targetIdx, 0, moved)
      saveOrder(next.map(c => c.cardId), role, isLeadership)
      return next
    })

    setDragIdx(null)
    setOverIdx(null)
  }, [dragIdx, role, isLeadership])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setOverIdx(null)
  }, [])

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

  // Lock all actions if case_position is not user's own scope
  const ownPositions = ROLE_OWN_POSITIONS[role] || []
  const isLocked = role !== "admin" && ownPositions.length > 0
    && pengaduan.case_position && !ownPositions.includes(pengaduan.case_position)

  return (
    <div className="flex flex-col gap-2">
      {isLocked && (
        <p className="text-yellow-400 text-xs text-center py-1 bg-yellow-900/20 rounded border border-yellow-800">
          🔒 Akses terkunci — {pengaduan.case_position} bukan milik {role}. Hanya bisa lihat.
        </p>
      )}
      {configs.map((cfg, idx) => {
        const def = aksiCardRegistry[cfg.cardId]
        if (!def) return null

        let isDisabled = isLocked
        if (!isDisabled && cfg.cardId === "distribusi") {
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

        const isDragging = dragIdx === idx
        const isDragOver = overIdx === idx && overIdx !== dragIdx

        return (
          <div
            key={cfg.cardId}
            className={`shrink-0 relative transition-all ${isDragOver ? "border-t-2 border-t-blue-400" : ""} ${isDragging ? "opacity-40" : ""}`}
          >
            {/* Drag handle */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(idx, e)}
              onDragOver={(e) => handleDragOver(idx, e)}
              onDrop={(e) => handleDrop(idx, e)}
              onDragEnd={handleDragEnd}
              className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 group"
              title="Geser posisi"
            >
              <GripVertical className="w-3 h-3 text-gray-600 group-hover:text-gray-300" />
            </div>
            {/* Card with left padding for drag handle */}
            <div className="pl-4">
              <Component {...componentProps} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
