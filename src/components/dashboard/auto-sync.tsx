"use client"

import { useEffect } from "react"

export default function AutoSync() {
  useEffect(() => {
    const checkAndSync = async () => {
      try {
        const statusRes = await fetch("/api/sync/status")
        const status = await statusRes.json()
        const lastSync = status.last_sync ? new Date(status.last_sync).getTime() : 0
        const now = Date.now()
        const staleMs = 60 * 60 * 1000 // 1 jam
        if (!status.in_progress && (now - lastSync > staleMs || lastSync === 0)) {
          fetch("/api/sync", { method: "POST" }).catch(() => {})
        }
      } catch {}
    }
    checkAndSync()
  }, [])

  return null
}
