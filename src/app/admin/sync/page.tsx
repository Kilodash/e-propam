"use client"

import { useState, useEffect } from "react"
import { Loader2, RefreshCw } from "lucide-react"

export default function AdminSyncPage() {
  const [status, setStatus] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState("60")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    fetch("/api/sync/status").then(r => r.json()).then(setStatus).catch(() => {})
    fetch("/api/admin/settings").then(r => r.json()).then(j => {
      const row = (j.data ?? []).find((r: any) => r.key === "sync_config")
      if (row?.value?.interval_minutes) setIntervalMinutes(String(row.value.interval_minutes))
      if (row?.value?.enabled === false) setIntervalMinutes("0")
    }).catch(() => {})
  }, [])

  async function triggerSync() {
    setSyncing(true)
    setMsg("")
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      const json = await res.json()
      if (json.error) setMsg(`Error: ${json.error}`)
      else setMsg(`Sync selesai: ${json.count} record`)
    } catch (e: any) {
      setMsg(`Gagal: ${e.message}`)
    } finally {
      setSyncing(false)
      fetch("/api/sync/status").then(r => r.json()).then(setStatus).catch(() => {})
    }
  }

  async function saveConfig() {
    setSaving(true)
    setMsg("")
    const mins = parseInt(intervalMinutes) || 0
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "sync_config", value: { interval_minutes: mins, enabled: mins > 0 } }),
    })
    setSaving(false)
    setMsg("Tersimpan")
    setTimeout(() => setMsg(""), 2000)
  }

  return (
    <div className="max-w-2xl pb-12">
      <div className="mb-6 flex items-center justify-between sticky top-0 bg-[#0F172A] z-10 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Sinkronisasi Gajamada</h2>
          <p className="text-xs text-gray-500 mt-1">Pengaturan sync inbound dari Gajamada ke Supabase</p>
        </div>
        <button onClick={triggerSync} disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded font-medium disabled:opacity-50">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync Sekarang
        </button>
      </div>

      {status && (
        <div className="bg-[#0F172A] border border-gray-700 rounded-lg p-4 mb-4 space-y-2">
          <p className="text-xs text-gray-400">Status Sync</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Terakhir sync</p>
              <p className="text-white">{status.last_sync ? new Date(status.last_sync).toLocaleString("id-ID") : "Belum pernah"}</p>
            </div>
            <div>
              <p className="text-gray-500">Total record</p>
              <p className="text-white">{status.total_records ?? "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className={status.in_progress ? "text-yellow-400" : "text-green-400"}>
                {status.in_progress ? "Sedang berjalan" : "Idle"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Error</p>
              <p className={status.error ? "text-red-400" : "text-gray-500"}>{status.error || "-"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0F172A] border border-gray-700 rounded-lg p-4 space-y-3">
        <p className="text-xs text-gray-400">Pengaturan Auto-Sync</p>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">Interval (menit)</label>
          <input type="number" value={intervalMinutes} onChange={e => setIntervalMinutes(e.target.value)}
            min="0" max="1440"
            className="w-24 text-sm bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-2 h-8" />
          <span className="text-xs text-gray-500">0 = matikan auto-sync</span>
        </div>
        <p className="text-xs text-gray-500">
          Auto-sync berjalan saat halaman dashboard dibuka jika sync terakhir lebih lama dari interval.
          Sync manual tetap bisa dilakukan kapan saja.
        </p>
        <button onClick={saveConfig} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded text-sm disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Simpan
        </button>
        {msg && <p className="text-xs text-green-400">{msg}</p>}
      </div>
    </div>
  )
}
