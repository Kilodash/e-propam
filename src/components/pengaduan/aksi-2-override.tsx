"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"

export default function Aksi2Override({
  pengaduanId,
  prepetratorId,
  pengaduan,
  config,
}: AksiCardRenderProps) {
  const [allUnits, setAllUnits] = useState<{ value: string; label: string }[]>([])
  const [open, setOpen] = useState(false)
  const [unit, setUnit] = useState("")
  const [alasan, setAlasan] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/units")
      .then(r => r.json())
      .then(json => {
        const raw = (json.data ?? []) as any[]
        const options = raw
          .sort((a, b) => (a.gajamada_name || "").localeCompare(b.gajamada_name || ""))
          .map((u: any) => ({ value: u.gajamada_name, label: u.gajamada_name }))
        setAllUnits(options)
      })
      .catch(() => {})
  }, [])

  async function submit() {
    if (!unit) { setError("Pilih unit tujuan"); return }
    if (!alasan.trim()) { setError("Catatan override wajib diisi"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override",
          pengaduanId,
          prepetratorId,
          targetUnit: unit,
          alasan,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal override")
      setUnit("")
      setAlasan("")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AksiCard
      title="Aksi 2: Distribusi Langsung (Over-ride)"
      variant="warning"
      toggleable
      defaultOpen={false}
      action={{
        label: open ? "Tutup" : "Buka",
        onClick: () => setOpen(o => !o),
      }}
    >
      <div className="space-y-3 pt-2 border-t border-yellow-700/50">
        <div>
          <p className="text-xs font-semibold text-yellow-400 mb-1">Unit Tujuan</p>
          <Select value={unit} onValueChange={(v) => setUnit(v ?? "")}>
            <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
              <SelectValue placeholder="Pilih satker tujuan distribusi langsung" />
            </SelectTrigger>
            <SelectContent className="z-50 max-h-72">
              {allUnits.slice(0, 100).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="text-xs font-semibold text-yellow-400 mb-1">Catatan Over-ride</p>
          <Textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            placeholder="Alasan distribusi langsung ke unit..."
            className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-yellow-700 hover:bg-yellow-600 text-white h-8 text-xs rounded disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : "✈"}
          <span className="ml-1">Distribusi Langsung</span>
        </button>
      </div>
    </AksiCard>
  )
}
