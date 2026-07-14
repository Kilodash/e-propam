"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftRight, Loader2, Save, RefreshCw } from "lucide-react"
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

const SATKER_OPTIONS = [
  { value: "PAMINAL", label: "Subbid Paminal" },
  { value: "PROVOS", label: "Subbid Provos" },
  { value: "WABPROF", label: "Subbid Wabprof" },
  { value: "REHABPERS", label: "Subbag Rehabpers" },
  { value: "POLRES_SUKABUMI", label: "Polres Sukabumi" },
  { value: "POLRES_BANDUNG", label: "Polresta Bandung" },
  { value: "POLRES_BOGOR", label: "Polres Bogor" },
  { value: "POLRES_CIREBON", label: "Polres Cirebon" },
  { value: "SATBRIMOB", label: "Satbrimob" },
  { value: "WASSIDIK", label: "Wassidik Ditreskrimum" },
]

interface Props {
  pengaduanId: string
  prepetratorId: string
  saran: string
  telaah: boolean
  kelengkapan: boolean
  satkerTujuan: string
  position: number
  total: number
  prevId: string | null
  nextId: string | null
}

export default function LembarDisposisi({
  pengaduanId,
  prepetratorId,
  saran: initialSaran,
  telaah: initialTelaah,
  kelengkapan: initialKelengkapan,
  satkerTujuan: initialSatker,
  position,
  total,
  prevId,
  nextId,
}: Props) {
  const [saran, setSaran] = useState(initialSaran)
  const [telaah, setTelaah] = useState(initialTelaah)
  const [kelengkapan, setKelengkapan] = useState(initialKelengkapan)
  const [satker, setSatker] = useState(initialSatker)
  const [override, setOverride] = useState(false)
  const [overrideUnit, setOverrideUnit] = useState("")
  const [overrideAlasan, setOverrideAlasan] = useState("")
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  function reset() {
    setSaran(initialSaran)
    setTelaah(initialTelaah)
    setKelengkapan(initialKelengkapan)
    setSatker(initialSatker)
    setOverride(false)
    setOverrideUnit("")
    setOverrideAlasan("")
    setError(null)
    setSuccess(null)
  }

  async function doOverride() {
    if (!overrideUnit) {
      setOverrideError("Pilih unit tujuan")
      return
    }
    if (!overrideAlasan.trim()) {
      setOverrideError("Catatan override wajib diisi")
      return
    }
    setOverrideLoading(true)
    setOverrideError(null)
    try {
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override",
          pengaduanId,
          prepetratorId,
          targetUnit: overrideUnit,
          alasan: overrideAlasan,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal override")
      setOverrideUnit("")
      setOverrideAlasan("")
      setOverride(false)
      router.refresh()
      if (nextId) router.push(`/dashboard/disposisi/${nextId}`)
    } catch (e: any) {
      setOverrideError(e.message)
    } finally {
      setOverrideLoading(false)
    }
  }

  async function submit(thenAdvance: boolean) {
    if (!saran.trim()) {
      setError("Saran wajib diisi")
      return
    }
    if (!telaah || !kelengkapan) {
      setError("Lengkapi checklist penelaahan dan kelengkapan")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Save saran
      const saranRes = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "saran", pengaduanId, saran }),
      })
      const saranJson = await saranRes.json()
      if (!saranRes.ok || !saranJson.success) throw new Error(saranJson.error || "Gagal simpan saran")

      // 2. Mark telaah + kelengkapan + satker
      const supabase = await import("@/lib/supabase/client").then(m => m.createClient())
      await supabase.from("pengaduan").update({
        telaah,
        telaah_at: telaah ? new Date().toISOString() : null,
        kelengkapan,
        kelengkapan_at: kelengkapan ? new Date().toISOString() : null,
        disposisi_satker_tujuan: satker || null,
        disposisi_satker_at: satker ? new Date().toISOString() : null,
      }).eq("id", pengaduanId)

      setSuccess("Saran & Lanjut tersimpan")
      router.refresh()

      if (thenAdvance && nextId) {
        router.push(`/dashboard/disposisi/${nextId}`)
      } else if (thenAdvance) {
        router.push("/dashboard/disposisi?tab=antrian")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border-2 border-blue-500 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeftRight className="w-4 h-4 text-blue-700" />
          <h3 className="text-sm font-semibold text-gray-900">Lembar Disposisi</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Ceklis Penelaahan</p>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <Checkbox checked={telaah} onCheckedChange={(v) => setTelaah(Boolean(v))} />
                Sudah dilakukan penelaahan
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <Checkbox checked={kelengkapan} onCheckedChange={(v) => setKelengkapan(Boolean(v))} />
                Sudah diperiksa kelengkapan
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1.5">Saran / Masukan</p>
            <Textarea
              value={saran}
              onChange={(e) => setSaran(e.target.value)}
              placeholder="Saran untuk Kabid Propam..."
              className="min-h-[80px] text-sm"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1.5">Satker/Satwil Tujuan</p>
            <Select value={satker} onValueChange={(v) => setSatker(v ?? "")}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Pilih satker/satwil" />
              </SelectTrigger>
              <SelectContent>
                {SATKER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}
          {success && <p className="text-green-600 text-xs">{success}</p>}

          <Button
            onClick={() => submit(true)}
            disabled={loading}
            className="w-full bg-blue-200 hover:bg-blue-300 text-blue-900"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Simpan Saran & Lanjut
          </Button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">✈</span>
            <span className="text-sm font-semibold text-yellow-900">Distribusi Langsung (Over-ride)</span>
          </div>
          <button
            onClick={() => setOverride(!override)}
            className={`w-10 h-5 rounded-full transition ${override ? "bg-blue-700" : "bg-gray-300"}`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${override ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {override && (
          <div className="space-y-3 pt-2 border-t border-yellow-300">
            <div>
              <p className="text-xs font-semibold text-yellow-900 mb-1">Unit Tujuan</p>
              <Select value={overrideUnit} onValueChange={(v) => setOverrideUnit(v ?? "")}>
                <SelectTrigger className="w-full text-sm bg-white">
                  <SelectValue placeholder="Pilih satker tujuan distribusi langsung" />
                </SelectTrigger>
                <SelectContent>
                  {SATKER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-semibold text-yellow-900 mb-1">Catatan Over-ride</p>
              <Textarea
                value={overrideAlasan}
                onChange={(e) => setOverrideAlasan(e.target.value)}
                placeholder="Alasan distribusi langsung ke unit..."
                className="min-h-[60px] text-sm"
              />
            </div>
            {overrideError && <p className="text-red-600 text-xs">{overrideError}</p>}
            <Button
              onClick={doOverride}
              disabled={overrideLoading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {overrideLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <span>✈</span>}
              Distribusi Langsung
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between text-sm">
        <Link
          href={prevId ? `/dashboard/disposisi/${prevId}` : "#"}
          className={`flex items-center gap-1 ${prevId ? "text-gray-700 hover:text-blue-700" : "text-gray-300 pointer-events-none"}`}
        >
          ← Prev
        </Link>
        <span className="text-gray-700">{position} / {total}</span>
        <button
          onClick={() => {
            reset()
            setSuccess(null)
            setError(null)
          }}
          className="text-gray-700 hover:text-blue-700"
        >
          Detail
        </button>
        <Link
          href={nextId ? `/dashboard/disposisi/${nextId}` : "#"}
          className={`flex items-center gap-1 ${nextId ? "text-gray-700 hover:text-blue-700" : "text-gray-300 pointer-events-none"}`}
        >
          Next →
        </Link>
      </div>
    </div>
  )
}
