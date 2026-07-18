"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Plus, Check, X, Search } from "lucide-react"

interface UnitMapping {
  id: number
  gajamada_name: string
  normalized_name: string
  police_function: string | null
  satker_level: string | null
  source: string | null
  first_seen_at: string | null
  last_seen_at: string | null
  sort_order: number | null
  is_active: boolean
  is_active_initial?: boolean
  search_key?: string
  fallback_position?: string | null
}

type SortKey = "gajamada_name" | "normalized_name" | "satker_level" | "police_function" | "source"
type SortDir = "asc" | "desc"

const LEVEL_LABELS: Record<string, string> = {
  subbid: "Subbid", subbag: "Subbag", polresta: "Polresta", polres: "Polres",
  tabes: "Polrestabes", wassidik: "Wassidik", brimob: "Brimob", ditpolair: "Ditpolair",
}

const VALID_LEVELS = ["subbid", "subbag", "polres", "tabes", "brimob", "ditpolair", "wassidik"]
const VALID_FUNGSI = ["PAMINAL", "PROVOS", "WABPROF", "YANDUAN", "REHABPERS", "POLRES", "BRIMOB", "POLAIR", "WASSIDIK"]

const COLUMNS: { key: SortKey; label: string; width?: string }[] = [
  { key: "gajamada_name", label: "Gajamada" },
  { key: "normalized_name", label: "Display" },
  { key: "satker_level", label: "Level", width: "min-w-[140px]" },
  { key: "police_function", label: "Fungsi", width: "min-w-[140px]" },
  { key: "source", label: "Sumber" },
]

export default function UnitMappingPage() {
  const [units, setUnits] = useState<UnitMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("satker_level")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [editing, setEditing] = useState<{ id: number; col: SortKey } | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [showAdd, setShowAdd] = useState(false)
  const [newUnit, setNewUnit] = useState({ gajamada_name: "", normalized_name: "", police_function: "", satker_level: "polres", fallback_position: "" })

  async function fetchUnits() {
    setLoading(true)
    try {
      const res = await fetch("/api/units?admin=true")
      const json = await res.json()
      setUnits((json.data ?? []) as UnitMapping[])
    } catch {
      setError("Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUnits() }, [])

  const sorted = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = q
      ? units.filter(u =>
          u.gajamada_name.toLowerCase().includes(q) ||
          u.normalized_name.toLowerCase().includes(q) ||
          (u.police_function ?? "").toLowerCase().includes(q)
        )
      : units
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? ""
      const vb = b[sortKey] ?? ""
      return String(va).localeCompare(String(vb), "id", { numeric: true }) * (sortDir === "asc" ? 1 : -1)
    })
  }, [units, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  async function toggleActive(id: number) {
    const unit = units.find(u => u.id === id)
    if (!unit) return
    const newActive = !unit.is_active
    setUnits(prev => prev.map(u => u.id === id ? { ...u, is_active: newActive } : u))
    await fetch("/api/units", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: newActive }),
    })
  }

  function startEdit(id: number, col: SortKey, currentValue: string) {
    setEditing({ id, col })
    setEditValue(currentValue || "")
  }

  function cancelEdit() {
    setEditing(null)
    setEditValue("")
  }

  async function saveEdit() {
    if (!editing) return
    const { id, col } = editing
    const field = col
    await fetch("/api/units", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: editValue || null }),
    })
    setEditing(null)
    fetchUnits()
  }

  async function deleteUnit(id: number) {
    if (!confirm("Hapus unit ini?")) return
    await fetch(`/api/units?id=${id}`, { method: "DELETE" })
    fetchUnits()
  }

  async function addUnit() {
    if (!newUnit.gajamada_name || !newUnit.normalized_name) return
    await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUnit),
    })
    setNewUnit({ gajamada_name: "", normalized_name: "", police_function: "", satker_level: "polres", fallback_position: "" })
    setShowAdd(false)
    fetchUnits()
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">Normalisasi Nama Unit</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari unit..."
              className="pl-8 bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500 h-9 w-64"
            />
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="bg-[#0369A1] hover:bg-[#0284c7] text-white">
            <Plus className="w-4 h-4 mr-1" /> Tambah Unit
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-[#0F172A] border border-gray-700 rounded-lg p-4 mb-4 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-200 mb-3">Unit Baru</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Gajamada Name (contoh: KASUBBID X POLDA JAWA BARAT)" value={newUnit.gajamada_name} onChange={(e) => setNewUnit(s => ({ ...s, gajamada_name: e.target.value }))} className="bg-[#1E293B] border-gray-600 text-gray-200" />
            <Input placeholder="Display Name (contoh: Subbid X)" value={newUnit.normalized_name} onChange={(e) => setNewUnit(s => ({ ...s, normalized_name: e.target.value }))} className="bg-[#1E293B] border-gray-600 text-gray-200" />
            <Input placeholder="Fungsi (opsional)" value={newUnit.police_function} onChange={(e) => setNewUnit(s => ({ ...s, police_function: e.target.value }))} className="bg-[#1E293B] border-gray-600 text-gray-200" />
            <Input placeholder="Fallback Position (opsional, untuk unit manual)" value={newUnit.fallback_position} onChange={(e) => setNewUnit(s => ({ ...s, fallback_position: e.target.value }))} className="bg-[#1E293B] border-gray-600 text-gray-200" />
            <Select value={newUnit.satker_level} onValueChange={(v) => setNewUnit(s => ({ ...s, satker_level: v ?? "polres" }))}>
              <SelectTrigger className="bg-[#1E293B] border-gray-600 text-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>{VALID_LEVELS.map(l => <SelectItem key={l} value={l}>{LEVEL_LABELS[l] || l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={addUnit} className="bg-[#0369A1] hover:bg-[#0284c7] text-white">Simpan</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="text-gray-300 border-gray-600">Batal</Button>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="flex-1 min-h-0 overflow-y-auto bg-[#0F172A] rounded-lg border border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0F172A] z-10">
              <tr className="border-b border-gray-700 text-left">
                <th className="text-gray-400 font-medium p-3 w-12">#</th>
                {COLUMNS.map(col => (
                  <th key={col.key} onClick={() => toggleSort(col.key)} className="text-gray-300 font-medium p-3 cursor-pointer hover:text-white select-none group">
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-[#0369A1]" /> : <ArrowDown className="w-3 h-3 text-[#0369A1]" />) : <ArrowUpDown className="w-3 h-3 text-gray-600 group-hover:text-gray-400" />}
                    </span>
                  </th>
                ))}
                <th className="text-gray-300 font-medium p-3 text-right">Aksi</th>
                <th className="text-gray-300 font-medium p-3 w-14"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-700 last:border-0 hover:bg-[#1E293B] ${!m.is_active ? "opacity-50" : ""}`}>
                  <td className="p-3 text-gray-500 text-xs">{i + 1}</td>
                  {COLUMNS.map(col => (
                    <td
                      key={col.key}
                      className="p-3 text-gray-200 cursor-pointer hover:bg-[#273548]"
                      onClick={(e) => {
                        if (col.key === "source") return
                        if (editing && editing.id === m.id && editing.col === col.key) return
                        const current = String(m[col.key as keyof UnitMapping] ?? "")
                        startEdit(m.id, col.key, current)
                        e.stopPropagation()
                      }}
                    >
                      {editing && editing.id === m.id && editing.col === col.key ? (
                        col.key === "satker_level" ? (
                          <Select value={editValue} onValueChange={(v) => setEditValue(v ?? "")}>
                            <SelectTrigger className="h-7 text-xs bg-[#1E293B] border-gray-600 text-gray-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {VALID_LEVELS.map(l => <SelectItem key={l} value={l}>{LEVEL_LABELS[l] || l}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : col.key === "police_function" ? (
                          <Select value={editValue} onValueChange={(v) => { setEditValue(v ?? ""); setTimeout(saveEdit, 0) }}>
                            <SelectTrigger className="h-7 text-xs bg-[#1E293B] border-gray-600 text-gray-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {VALID_FUNGSI.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit()
                              if (e.key === "Escape") cancelEdit()
                            }}
                            className="h-7 text-xs bg-[#1E293B] border-gray-600 text-gray-200"
                          />
                        )
                      ) : col.key === "satker_level" ? (
                        <span>{LEVEL_LABELS[m.satker_level ?? ""] || m.satker_level}</span>
                      ) : col.key === "source" ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          m.source === "seed" ? "bg-blue-900/50 text-blue-400" :
                          m.source === "auto" ? "bg-purple-900/50 text-purple-400" :
                          "bg-gray-800 text-gray-400"
                        }`}>
                          {m.source ?? "-"}
                        </span>
                      ) : (
                        m[col.key as keyof UnitMapping] ?? "-"
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-right">
                    <button onClick={() => deleteUnit(m.id)} className="p-1 text-gray-400 hover:text-red-400 hover:bg-[#1E293B] rounded" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleActive(m.id)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${m.is_active ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}
                      title={m.is_active ? "Sembunyikan" : "Tampilkan"}
                    >
                      {m.is_active ? "on" : "off"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
