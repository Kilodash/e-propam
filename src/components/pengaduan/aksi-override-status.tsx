"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { STATUS_OPTIONS } from "@/lib/aksi-cards/presets"
import { type UnitFilterOption } from "@/lib/unit-search"
import SearchableSelect from "@/components/ui/searchable-select"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"

export default function AksiOverrideStatus({
  pengaduanId,
  prepetratorId,
  pengaduan,
  config,
}: AksiCardRenderProps) {
  const [allUnits, setAllUnits] = useState<UnitFilterOption[]>([])
  const [statusOptions, setStatusOptions] = useState(STATUS_OPTIONS)
  const [status, setStatus] = useState("")
  const [unit, setUnit] = useState("")
  const [alasan, setAlasan] = useState("")
  const [updateTimeline, setUpdateTimeline] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    Promise.all([
      fetch("/api/units").then(r => r.json()),
      fetch("/api/status-labels").then(r => r.json()),
    ])
      .then(([unitsJson, statusJson]) => {
        const raw = (unitsJson.data ?? []) as any[]
        const sorted: UnitFilterOption[] = raw
          .sort((a, b) => (a.gajamada_name || "").localeCompare(b.gajamada_name || ""))
          .map((u: any) => ({ value: u.gajamada_name, label: u.gajamada_name, casePositions: [u.gajamada_name] }))
        setAllUnits(sorted)
        if (statusJson.data?.length > 0) setStatusOptions(statusJson.data)
      })
      .catch(() => {})
  }, [])

  async function submit() {
    if (!unit && !status && !alasan.trim()) { setError("Minimal satu field diisi"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override_status",
          pengaduanId,
          prepetratorId,
          targetUnit: unit,
          status,
          alasan,
          updateTimeline,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal override")
      setAlasan("")
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const title = (config?.title as string) ?? "Over-ride Distribusi + Status"

  return (
    <AksiCard title={title} variant="warning">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-yellow-400 mb-1">Unit Tujuan</p>
          <SearchableSelect
            options={allUnits}
            value={unit}
            onChange={(v) => setUnit(v)}
            placeholder="Pilih unit tujuan..."
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-yellow-400 mb-1">Status Akhir</p>
          <SearchableSelect
            options={statusOptions}
            value={status}
            onChange={(v) => setStatus(v)}
            placeholder="Pilih status Gajamada..."
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-yellow-400 mb-1">Alasan / Catatan</p>
          <Textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Alasan over-ride..."
            className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={updateTimeline}
            onChange={(e) => setUpdateTimeline(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-500 text-[#0369A1]"
          />
          Update Timeline Gajamada
        </label>
        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-yellow-700 hover:bg-yellow-600 text-white h-8 text-xs rounded disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : null}
          Over-ride + Status
        </button>
      </div>
    </AksiCard>
  )
}
