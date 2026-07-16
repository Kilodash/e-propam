"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, X, Check, Square } from "lucide-react"

interface StatusCount { value: string; count: number }

export default function AdminStatusFilter() {
  const [allStatuses, setAllStatuses] = useState<StatusCount[]>([])
  const [allowed, setAllowed] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/status-labels?all=1").then(r => r.json()),
      fetch("/api/admin/settings").then(r => r.json()),
    ])
      .then(([statusJson, settingsJson]) => {
        const statuses = (statusJson.data ?? []) as StatusCount[]
        setAllStatuses(statuses)

        const setting = (settingsJson.data ?? []).find((s: { key: string }) => s.key === "allowed_status_labels")
        if (setting && Array.isArray(setting.value)) {
          setAllowed(new Set(setting.value as string[]))
        } else {
          setAllowed(new Set(statuses.map(s => s.value)))
        }
      })
      .catch(e => setMsg(`Gagal memuat: ${e.message}`))
      .finally(() => setLoading(false))
  }, [])

  function toggle(value: string) {
    setAllowed(prev => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function selectAll() {
    setAllowed(new Set(allStatuses.map(s => s.value)))
  }

  function deselectAll() {
    setAllowed(new Set())
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "allowed_status_labels", value: [...allowed] }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || "Gagal menyimpan")
      setMsg(`Tersimpan — ${allowed.size} status diizinkan`)
    } catch (e: any) {
      setMsg(`Gagal: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter
    ? allStatuses.filter(s => s.value.toLowerCase().includes(filter.toLowerCase()))
    : allStatuses

  const selectedCount = allStatuses.filter(s => allowed.has(s.value)).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Filter Status Gajamada</h1>
        <p className="text-sm text-gray-600 mt-1">
          Pilih status yang relevan untuk digunakan di E-PROPAM. Status yang tidak dipilih tidak akan muncul di combobox filter, form, dan dropdown.
          {allStatuses.length > 0 && (
            <span className="ml-2 font-medium text-[#0369A1]">
              {selectedCount} / {allStatuses.length} dipilih
            </span>
          )}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-3 border-b border-gray-200 flex items-center gap-2">
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Cari status..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#0369A1]"
          />
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          >
            Pilih Semua
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          >
            Hapus Semua
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left w-10">Pilih</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right w-20">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => {
                  const checked = allowed.has(s.value)
                  return (
                    <tr key={s.value} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggle(s.value)}>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); toggle(s.value) }}
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            checked ? "bg-[#0369A1] border-[#0369A1]" : "border-gray-400"
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-gray-800">{s.value}</td>
                      <td className="px-3 py-2 text-right text-gray-500 text-xs">
                        {s.count > 0 ? s.count : "-"}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500 text-sm">
                      Tidak ada status yang cocok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {msg && <span className={msg.startsWith("Gagal") ? "text-red-600" : "text-green-600"}>{msg}</span>}
          </div>
          <button
            onClick={save}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0369A1] hover:bg-[#0284c7] text-white text-sm rounded disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
