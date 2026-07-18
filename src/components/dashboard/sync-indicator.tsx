"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle2, XCircle, Loader2, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"
import type { SyncStatus } from "@/types"

export default function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [gajamadaOk, setGajamadaOk] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState(false)

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/sync/status")
    if (res.ok) setStatus(await res.json())
  }, [])

  const checkGajamada = useCallback(async () => {
    try {
      const res = await fetch("/api/sync/gajamada-status")
      const json = await res.json()
      setGajamadaOk(json.connected === true)
    } catch {
      setGajamadaOk(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    checkGajamada()
    const interval = setInterval(() => { fetchStatus(); checkGajamada() }, 300000)
    return () => clearInterval(interval)
  }, [fetchStatus, checkGajamada])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(`Sinkronisasi gagal: ${data.error || data.detail || "Unknown"}`)
      } else {
        await fetchStatus()
        toast.success(`Sinkronisasi berhasil (${data.count} data)`)
      }
    } catch (e: any) {
      toast.error(`Sinkronisasi gagal: ${e.message}`)
    } finally {
      setSyncing(false)
    }
  }

  const isStale =
    status?.last_sync &&
    Date.now() - new Date(status.last_sync).getTime() > 600000

  return (
    <div className="flex items-center gap-2">
      {gajamadaOk !== null && (
        gajamadaOk
          ? <span title="Gajamada: Terhubung"><Wifi className="w-3.5 h-3.5 text-green-400" /></span>
          : <span title="Gajamada: Tidak terhubung"><WifiOff className="w-3.5 h-3.5 text-red-400" /></span>
      )}
      {status?.in_progress ? (
        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
          <Loader2 className="w-3 h-3 animate-spin mr-1" /> Syncing...
        </Badge>
      ) : status?.error ? (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" /> Sync Error
        </Badge>
      ) : isStale ? (
        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
          Sync {Math.round((Date.now() - new Date(status!.last_sync!).getTime()) / 60000)}m lalu
        </Badge>
      ) : (
        <Badge variant="outline" className="text-green-400 border-green-400">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Synced
        </Badge>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSync}
        disabled={syncing}
        title="Sync manual"
      >
        <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
