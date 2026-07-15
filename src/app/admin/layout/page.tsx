"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Save, X, ChevronUp, ChevronDown } from "lucide-react"
import { aksiCardRegistry } from "@/lib/aksi-cards/registry"
import { KEMBALIKAN_TARGET_PRESETS } from "@/lib/aksi-cards/presets"
import type { CardLayoutConfig } from "@/lib/aksi-cards/types"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  yanduan: "Kasubbag Yanduan",
  kabid: "Kabid Propam",
  paminal: "Subbid Paminal",
  provos: "Subbid Provos",
  wabprof: "Subbid Wabprof",
  rehabpers: "Subbag Rehabpers",
  polres: "Polres",
}

export default function AdminLayoutPage() {
  const [role, setRole] = useState("yanduan")
  const [configs, setConfigs] = useState<Record<string, CardLayoutConfig>>({})
  const [order, setOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const dirtyRef = useRef(false)
  const roleRef = useRef(role)

  useEffect(() => {
    roleRef.current = role
    setLoading(true)
    fetch(`/api/card-layout?role=${role}`)
      .then(r => r.json())
      .then(json => {
        const data = (json.data ?? []) as CardLayoutConfig[]
        const map: Record<string, CardLayoutConfig> = {}
        for (const d of data) map[d.cardId] = d

        const savedOrder = data
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(d => d.cardId)

        const relevantIds = Object.entries(aksiCardRegistry)
          .filter(([, def]) => def.roles.includes(role) || def.roles.includes("admin"))
          .sort((a, b) => a[1].defaultOrder - b[1].defaultOrder)
          .map(([id]) => id)

        const merged = [...new Set([...savedOrder, ...relevantIds.filter(id => !savedOrder.includes(id))])]

        setConfigs(map)
        setOrder(merged)
        dirtyRef.current = false
        setLoading(false)
      })
  }, [role])

  function markDirty() { dirtyRef.current = true }

  function toggle(cardId: string) {
    const current = configs[cardId] ?? { cardId, enabled: false, sortOrder: 99, config: {} }
    setConfigs(prev => ({ ...prev, [cardId]: { ...current, enabled: !current.enabled } }))
    markDirty()
  }

  function toggleTarget(cardId: string, key: string, value: string) {
    const current = configs[cardId] ?? { cardId, enabled: false, sortOrder: 99, config: {} }
    const arr = (current.config[key] as string[]) ?? []
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    setConfigs(prev => ({ ...prev, [cardId]: { ...current, config: { ...current.config, [key]: next } } }))
    markDirty()
  }

  function moveUp(idx: number) {
    if (idx <= 0) return
    setOrder(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
    markDirty()
  }

  function moveDown(idx: number) {
    if (idx >= order.length - 1) return
    setOrder(prev => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
    markDirty()
  }

  function disableAll() {
    const updated: Record<string, CardLayoutConfig> = {}
    for (const id of Object.keys(configs)) {
      updated[id] = { ...configs[id], enabled: false }
    }
    for (const [id, def] of Object.entries(aksiCardRegistry)) {
      if (!updated[id]) {
        updated[id] = { cardId: id, enabled: false, sortOrder: def.defaultOrder, config: {} }
      }
    }
    setConfigs(updated)
    markDirty()
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const list = order.map((cardId, idx) => {
        const cfg = configs[cardId] ?? { cardId, enabled: false, sortOrder: idx, config: {} }
        return {
          cardId,
          enabled: cfg.enabled,
          sortOrder: idx,
          config: cfg.config ?? {},
        }
      })
      const res = await fetch("/api/card-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleRef.current, configs: list }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      dirtyRef.current = false
      setMsg("Disimpan.")
    } catch (e: any) {
      setMsg(`Gagal: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange(newRole: string) {
    if (dirtyRef.current) await save()
    setRole(newRole)
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Konfigurasi Card Aksi</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={disableAll} className="text-xs h-7 border-gray-600 text-gray-300">
            <X className="w-3 h-3 mr-1" /> Disable All
          </Button>
          <Button onClick={save} disabled={saving} className="bg-[#0369A1] hover:bg-[#0284c7] text-white h-7 text-xs">
            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
            Simpan
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => handleRoleChange(k)}
              className={`px-3 py-1 text-xs rounded border ${
                role === k
                  ? "bg-[#0369A1] text-white border-[#0369A1]"
                  : "border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {msg && <p className="text-xs text-green-400 mb-4">{msg}</p>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="w-10 px-2 py-2" />
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">Card Aksi</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">Aktif</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700">Konfigurasi</th>
              </tr>
            </thead>
            <tbody>
              {order.map((cardId, idx) => {
                const def = aksiCardRegistry[cardId]
                if (!def) return null
                const cfg = configs[cardId]
                const enabled = cfg?.enabled ?? (def.roles.includes(role) || role === "admin")
                const rowBg = idx % 2 === 0 ? "bg-[#0F172A]" : "bg-gray-900"

                return (
                  <tr key={cardId} className={`${rowBg} border-b border-gray-800`}>
                    <td className="px-1 py-2">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          className="text-gray-500 hover:text-white disabled:opacity-20"
                          aria-label="Geser ke atas"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveDown(idx)}
                          disabled={idx === order.length - 1}
                          className="text-gray-500 hover:text-white disabled:opacity-20"
                          aria-label="Geser ke bawah"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-white text-xs">{def.defaultTitle}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggle(cardId)}
                        className="w-4 h-4 rounded border-gray-500 bg-gray-700 text-[#0369A1] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      {cardId === "kembalikan-surat" && enabled && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {KEMBALIKAN_TARGET_PRESETS.map(t => {
                            const arr = (cfg?.config?.kembalikanTargets as string[]) ?? KEMBALIKAN_TARGET_PRESETS.map(p => p.value)
                            const checked = arr.includes(t.value)
                            return (
                              <label key={t.value} className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTarget(cardId, "kembalikanTargets", t.value)}
                                  className="w-3.5 h-3.5 rounded border-gray-500 text-[#0369A1] cursor-pointer"
                                />
                                {t.label}
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
