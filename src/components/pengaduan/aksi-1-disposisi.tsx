"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Pengaduan } from "@/types"
import AksiCard from "./aksi-card"

interface Props {
  pengaduanId: string
  prepetratorId: string
  pengaduan: Pengaduan
  unitOptions?: { value: string; label: string; casePositions?: string[] }[]
  config?: Record<string, any>
  role?: string
}

export default function Aksi1Disposisi({ pengaduanId, prepetratorId, pengaduan, config, role = "yanduan" }: Props) {
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([])
  const [saran, setSaran] = useState(pengaduan.saran_kabid ?? "")
  const [telaah, setTelaah] = useState(pengaduan.telaah ?? false)
  const [kelengkapan, setKelengkapan] = useState(pengaduan.kelengkapan ?? false)
  const [satker, setSatker] = useState(pengaduan.disposisi_satker_tujuan ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/units")
      .then(r => r.json())
      .then(json => {
        const raw = (json.data ?? []) as any[]
        // For yanduan: show normalized names
        const map = new Map<string, { value: string; label: string }>()
        for (const u of raw) {
          const key = u.normalized_name
          if (!map.has(key)) {
            map.set(key, { value: u.gajamada_name, label: u.normalized_name })
          }
        }
        const options = [...map.values()]
        options.sort((a, b) => a.label.localeCompare(b.label, "id"))
        setUnitOptions(options)
      })
      .catch(() => {})
  }, [])

  function reset() {
    setSaran("")
    setTelaah(false)
    setKelengkapan(false)
    setSatker("")
    setError(null)
    setSuccess(null)
  }

  async function submit() {
    if (!telaah || !kelengkapan) { setError("Ceklis Penelaahan wajib dicentang semua"); return }
    if (!saran.trim()) { setError("Saran wajib diisi"); return }
    if (!satker) { setError("Satker/Satwil Tujuan wajib dipilih"); return }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          pengaduanId,
          prepetratorId,
          saran,
          telaah,
          kelengkapan,
          satkerTujuan: satker,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyimpan")
      if (json.nextId) {
        router.push(`/dashboard/disposisi/${json.nextId}`)
      } else {
        router.push("/dashboard/yanduan")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AksiCard title="Aksi 1: Lembar Saran">
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">Ceklis Penelaahan</p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <Checkbox checked={telaah} onCheckedChange={(v) => setTelaah(Boolean(v))} />
              Sudah dilakukan penelaahan
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <Checkbox checked={kelengkapan} onCheckedChange={(v) => setKelengkapan(Boolean(v))} />
              Sudah diperiksa kelengkapan
            </label>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5">Saran / Masukan</p>
          <Textarea
            value={saran}
            onChange={(e) => setSaran(e.target.value)}
            placeholder="Saran untuk Kabid Propam..."
            className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 mb-1.5">Satker/Satwil Tujuan *</p>
          <Select value={satker} onValueChange={(v) => setSatker(v ?? "")}>
            <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
              <SelectValue placeholder="Pilih satker/satwil" />
            </SelectTrigger>
            <SelectContent className="z-50 max-h-72">
              {unitOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}
        {success && <p className="text-green-400 text-xs">{success}</p>}

        <div className="flex gap-2">
          <Button
            onClick={reset}
            disabled={loading}
            className="flex-1 bg-[#1E293B] hover:bg-[#334155] text-white h-8 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="flex-1 bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs"
          >
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
            Kirim ke Kabid
          </Button>
        </div>
      </div>
    </AksiCard>
  )
}
