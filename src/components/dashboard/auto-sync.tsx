"use client"

import { useEffect, useRef } from "react"

let _lastCheck = 0
const CHECK_INTERVAL = 5 * 60 * 1000 // 5 menit

export default function AutoSync() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const now = Date.now()
    if (now - _lastCheck < CHECK_INTERVAL) return
    _lastCheck = now

    const checkAndSync = async () => {
      try {
        const statusRes = await fetch("/api/sync/status")
        if (!statusRes.ok) return
        const status = await statusRes.json()
        const lastSync = status.last_sync ? new Date(status.last_sync).getTime() : 0
        const staleMs = 60 * 60 * 1000
        if (!status.in_progress && (now - lastSync > staleMs || lastSync === 0)) {
          fetch("/api/sync", { method: "POST" }).catch(() => {})
        }
      } catch {}
    }
    checkAndSync()
  }, [])
  ;(AutoSync as any)._reset = () => { _lastCheck = 0 }

  return null
}
