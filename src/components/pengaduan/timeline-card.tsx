"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import TimelineStepper from "./timeline-stepper"
import CatatanForm from "./catatan-form"
import { SectionCard } from "./detail-gajamada"
import { getUnifiedTimeline } from "@/lib/timeline-merge"
import type { TimelineItem } from "@/types"

interface Props {
  prepetratorId: string
  pengaduanId: string
  authorEmail: string
  authorRole: string
}

export default function TimelineCard({ prepetratorId, pengaduanId, authorEmail, authorRole }: Props) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getUnifiedTimeline(prepetratorId)
      setItems(result)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [prepetratorId])

  useEffect(() => { fetch() }, [fetch])

  return (
    <SectionCard
      title="Catatan & Timeline"
      badge={loading ? "..." : `${items.length}`}
      className="h-full"
      scrollable
      action={
        <button
          onClick={fetch}
          disabled={loading}
          className="text-xs text-[#0369A1] hover:text-blue-500 disabled:opacity-40"
          title="Refresh timeline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <TimelineStepper items={items} />
      <div className="mt-2 pt-2 border-t border-gray-100">
        <CatatanForm pengaduanId={pengaduanId} prepetratorId={prepetratorId} authorEmail={authorEmail} authorRole={authorRole} />
      </div>
    </SectionCard>
  )
}
