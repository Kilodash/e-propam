"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { KEMBALIKAN_TARGET_PRESETS } from "@/lib/aksi-cards/presets"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"

function resolveTargets(targetList?: string[]) {
  if (!targetList || targetList.length === 0) return KEMBALIKAN_TARGET_PRESETS
  return targetList
    .map(v => {
      const match = KEMBALIKAN_TARGET_PRESETS.find(p => p.value === v)
      return match ?? { value: v, label: v }
    })
}

export default function Aksi3Kembalikan({
  pengaduanId,
  prepetratorId,
  config,
}: AksiCardRenderProps) {
  const targets = resolveTargets(config?.kembalikanTargets as string[] | undefined)
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState(targets[0]?.value ?? "")
  const [alasan, setAlasan] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit() {
    if (!alasan.trim()) { setError("Alasan wajib diisi"); return }
    if (!target) { setError("Pilih tujuan pengembalian"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "kembalikan",
          pengaduanId,
          prepetratorId,
          targetRole: target,
          alasan,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengembalikan")
      setAlasan("")
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const title = config?.title as string ?? "Kembalikan"

  return (
    <>
      <AksiCard
        title={title}
        variant="danger"
        action={{
          label: "Kembalikan",
          onClick: () => setOpen(true),
        }}
      >
        <p className="text-xs text-gray-400">
          Kirim pengaduan kembali ke tujuan yang dipilih dengan alasan.
        </p>
      </AksiCard>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-gray-600 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-3">
              <Undo2 className="w-4 h-4 text-red-400" />
              <h3 className="text-white font-semibold">{title}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Tujuan Pengembalian</p>
                <Select value={target} onValueChange={(v) => setTarget(v ?? "")}>
                  <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
                    <SelectValue placeholder="Pilih tujuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {targets.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Alasan Pengembalian</p>
                <Textarea
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Jelaskan alasan pengembalian..."
                  className="min-h-[80px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
                  rows={3}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setOpen(false); setAlasan(""); setError(null) }}
                  className="text-gray-300 border-gray-600"
                >
                  Batal
                </Button>
                <Button
                  onClick={submit}
                  disabled={loading || !alasan.trim() || !target}
                  className="bg-red-700 hover:bg-red-600 text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Kembalikan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
