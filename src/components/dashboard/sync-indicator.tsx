"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { SyncStatus } from "@/types"

export default function SyncIndicator() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/sync/status")
    if (res.ok) setStatus(await res.json())
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 300000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      if (!res.ok) throw new Error("Sync failed")
      await fetchStatus()
      toast.success("Sinkronisasi berhasil")
    } catch {
      toast.error("Sinkronisasi gagal")
    } finally {
      setSyncing(false)
    }
  }

  const isStale =
    status?.last_sync &&
    Date.now() - new Date(status.last_sync).getTime() > 600000

  return (
    <div className="flex items-center gap-2">
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
