"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import SearchableSelect from "@/components/ui/searchable-select"
import { groupUnitsByNormalizedName } from "@/lib/unit-search"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
}

const DEFAULT_CHECKLIST = [
  { id: "tindaklanjuti", label: "TINDAKLANJUTI", defaultChecked: true },
  { id: "laporkan", label: "LAPORKAN HASILNYA", defaultChecked: true },
  { id: "catat", label: "CATAT/DATAKAN/FILE", defaultChecked: false },
]

function resolveChecklist(config?: Record<string, any>): ChecklistItem[] {
  const items = (config?.checklist as any[]) ?? DEFAULT_CHECKLIST
  return items.map((item: any) => ({
    id: item.id || item.label,
    label: item.label || item.id,
    checked: item.defaultChecked ?? false,
  }))
}

const SUBBID_LEADERSHIP: Record<string, string> = {
  paminal: "KASUBBID PAMINAL POLDA JAWA BARAT",
  provos: "KASUBBID PROVOS POLDA JAWA BARAT",
  wabprof: "KASUBBID WABPROF POLDA JAWA BARAT",
  rehabpers: "KASUBBAG REHABPERS POLDA JAWA BARAT",
}

const POLICE_FN: Record<string, string> = {
  paminal: "PAMINAL", provos: "PROVOS", wabprof: "WABPROF", rehabpers: "REHABPERS", polres: "POLRES",
}

const SELF_EXCLUDE: Record<string, RegExp> = {
  kabid: /KABID PROPAM/i,
  paminal: /KASUBBID PAMINAL/i,
  provos: /KASUBBID PROVOS/i,
  wabprof: /KASUBBID WABPROF/i,
  rehabpers: /KASUBBAG REHABPERS/i,
  yanduan: /KASUBBAG YANDUAN|OPERATOR YANDUAN/i,
}

const PREFIX_ORDER: Record<string, number> = {
  KASUBBID: 1, KASUBBAG: 1, KABID: 0,
  KAUR: 2, UR: 3, UNIT: 4, KANIT: 5, OPERATOR: 6,
}

export default function AksiDistribusi({
  role,
  pengaduanId,
  prepetratorId,
  pengaduan,
  config,
  disabled = false,
}: AksiCardRenderProps & { disabled?: boolean }) {
  const [scope, setScope] = useState<"self" | "all">(() => {
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/scope=(\w+)/)
      return (match?.[1] === "self" ? "self" : "all") as "self" | "all"
    }
    return "all"
  })
  const [allUnits, setAllUnits] = useState<{ value: string; label: string }[]>([])
  const [target, setTarget] = useState("")
  const [alasan, setAlasan] = useState("")
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => resolveChecklist(config))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isGrouped = role === "kabid" || role === "yanduan" || role === "admin"
  const policeFn = POLICE_FN[role]
  const leadershipPos = SUBBID_LEADERSHIP[role]

  useEffect(() => {
    fetch("/api/units")
      .then(r => r.json())
      .then(json => {
        let raw = (json.data ?? []) as any[]

        // Filter by police_function for subbid/polres
        if (policeFn) {
          raw = raw.filter((u: any) => u.police_function === policeFn)
        }

        // Scope: self = leadership only, all = full subbid
        if (scope === "self" && leadershipPos) {
          raw = raw.filter((u: any) => u.gajamada_name === leadershipPos)
        }

        // Exclude self when scope is "all" (so user can't distribusi to themselves)
        if (scope === "all") {
          const pattern = SELF_EXCLUDE[role]
          if (pattern) {
            raw = raw.filter((u: any) => !pattern.test(u.gajamada_name))
          }
        }

        if (isGrouped) {
          const map = new Map<string, { value: string; label: string }>()
          for (const u of raw) {
            const key = u.normalized_name
            if (!map.has(key)) {
              map.set(key, { value: u.gajamada_name, label: u.normalized_name })
            }
          }
          const options = [...map.values()]
          options.sort((a, b) => a.label.localeCompare(b.label, "id"))
          setAllUnits(options)
        } else {
          const options = raw
            .map((u: any) => ({ value: u.gajamada_name, label: u.gajamada_name }))
            .sort((a, b) => {
              const pa = a.label.split(" ")[0] || "Z"
              const pb = b.label.split(" ")[0] || "Z"
              return (PREFIX_ORDER[pa] ?? 99) - (PREFIX_ORDER[pb] ?? 99) || a.label.localeCompare(b.label)
            })
          setAllUnits(options)
        }
      })
      .catch(() => setAllUnits([]))
  }, [role, scope])

  function switchScope(s: string) {
    document.cookie = `scope=${s}; path=/; max-age=86400`
    setScope(s as "self" | "all")
    router.refresh()
  }

  function toggleCheck(id: string) {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c))
  }

  function setCheckLabel(id: string, label: string) {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, label } : c))
  }

  function buildDisposisiNote(): string {
    const checked = checklist.filter(c => c.checked)
    const lines: string[] = []
    if (alasan.trim()) lines.push(alasan.trim())
    for (const c of checked) lines.push(c.label)
    return lines.join("\n") || "Distribusi tanpa catatan"
  }

  async function submit() {
    if (!target) { setError("Pilih unit tujuan"); return }
    setLoading(true)
    setError(null)
    try {
      const disposisiNote = buildDisposisiNote()
      const gajamadaStatusByUnit = (config?.gajamadaStatusByUnit as Record<string, string>) || {}
      const gajamadaStatus = gajamadaStatusByUnit[target] || (config?.gajamadaStatus as string) || "PROSES LIDIK"
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "distribute",
          pengaduanId,
          prepetratorId,
          targetUnit: target,
          alasan: disposisiNote,
          checklist: checklist.filter(c => c.checked).map(c => ({ label: c.label })),
          gajamadaStatus,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal distribusi")
      setAlasan("")
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const title = (config?.title as string) ?? "Distribusi"
  const fullTitle = disabled ? `${title} 🔒` : title
  const showScopeToggle = !!leadershipPos

  return (
    <AksiCard
      title={fullTitle}
      variant="default"
      headerRight={
        showScopeToggle && !disabled ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchScope("self")}
              className={`px-1.5 py-0.5 rounded text-xs ${
                scope === "self"
                  ? "bg-[#0369A1] text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {leadershipPos?.split(" ").slice(0, 2).join(" ")}
            </button>
            <button
              onClick={() => switchScope("all")}
              className={`px-1.5 py-0.5 rounded text-xs ${
                scope === "all"
                  ? "bg-[#0369A1] text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Semua
            </button>
          </div>
        ) : undefined
      }
    >
      <div className={`space-y-3 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
        {/* Usulan Yanduan */}
        {(pengaduan.saran_kabid || pengaduan.disposisi_satker_tujuan) && (
          <div className="bg-[#1E293B] p-3 rounded-md border border-gray-700">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Saran Yanduan</p>
            <div className="space-y-1.5 text-xs">
              {pengaduan.disposisi_satker_tujuan && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 whitespace-nowrap">Satker:</span>
                  <span className="text-gray-200 text-right font-medium">{pengaduan.disposisi_satker_tujuan}</span>
                </div>
              )}
              {pengaduan.saran_kabid && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 whitespace-nowrap">Catatan:</span>
                  <span className="text-gray-200 text-right italic">"{pengaduan.saran_kabid}"</span>
                </div>
              )}
              <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700/50">
                <span className={`px-2 py-0.5 rounded-full ${pengaduan.telaah ? "bg-green-900/30 text-green-400 border border-green-800/30" : "bg-red-900/30 text-red-400 border border-red-800/30"}`}>
                  Penelaahan {pengaduan.telaah ? "✓" : "✗"}
                </span>
                <span className={`px-2 py-0.5 rounded-full ${pengaduan.kelengkapan ? "bg-green-900/30 text-green-400 border border-green-800/30" : "bg-red-900/30 text-red-400 border border-red-800/30"}`}>
                  Kelengkapan {pengaduan.kelengkapan ? "✓" : "✗"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5">Unit Tujuan</p>
          <SearchableSelect
            options={allUnits}
            value={target}
            onChange={(v) => setTarget(v)}
            placeholder="Pilih unit tujuan..."
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5">Ceklis Disposisi</p>
          <div className="space-y-1.5">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                    item.checked ? "bg-[#0369A1] border-[#0369A1]" : "border-gray-500 bg-gray-700"
                  }`}
                  onClick={() => toggleCheck(item.id)}
                >
                  {item.checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => setCheckLabel(item.id, e.target.value)}
                  className="flex-1 px-2 py-1 text-xs bg-[#1E293B] border border-gray-600 rounded text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-[#0369A1]"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5">Alasan / Catatan</p>
          <Textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Tulis catatan distribusi..."
            className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || disabled}
          className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : null}
          Distribusi
        </button>
      </div>
    </AksiCard>
  )
}
