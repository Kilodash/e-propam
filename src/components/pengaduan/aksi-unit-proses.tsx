"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Play, Send, CheckCircle2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_OPTIONS } from "@/lib/aksi-cards/presets"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"

export default function AksiUnitProses({
  pengaduanId,
  prepetratorId,
  pengaduan,
  config,
}: AksiCardRenderProps) {
  const [statusOpts, setStatusOpts] = useState(STATUS_OPTIONS)
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState("")
  const [nextStatus, setNextStatus] = useState("Proses Lidik")
  const [hasil, setHasil] = useState("")
  const [rekomendasi, setRekomendasi] = useState("selesai")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/status-labels")
      .then(r => r.json())
      .then(json => { if (json.data?.length > 0) setStatusOpts(json.data) })
      .catch(() => {})
  }, [])

  const isDone = unitStatus === "selesai"
  const title = (config?.title as string) ?? "Proses Unit"

  async function handleMulai() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mulai", pengaduanId, prepetratorId, currentPosition }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleProgress() {
    if (!progress.trim()) { setError("Progress wajib diisi"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "progress", pengaduanId, prepetratorId, currentPosition, progress, nextStatus }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      setProgress("")
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelesai() {
    if (!hasil.trim()) { setError("Hasil penyelidikan wajib diisi"); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "selesai", pengaduanId, prepetratorId, currentPosition, hasil, rekomendasi }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      router.refresh()
      if (rekomendasi.startsWith("limpah")) {
        router.push("/dashboard/unit")
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AksiCard title={title} variant={isDone ? "default" : "default"}>
      <div className="space-y-3">
        {!unitStatus && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Tandai pengaduan ini sebagai diproses dan mulai penyelidikan.</p>
            {error && <p className="text-red-400 text-xs mb-1">{error}</p>}
            {success && <p className="text-green-400 text-xs mb-1">{success}</p>}
            <button
              onClick={handleMulai}
              disabled={loading}
              className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Play className="w-3 h-3 mr-1 inline" />}
              Mulai Proses
            </button>
          </div>
        )}

        {unitStatus === "dalam_proses" && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Status</p>
              <Select value={nextStatus} onValueChange={(v) => setNextStatus(v ?? "Proses Lidik")}>
                <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOpts.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Catatan Progress</p>
              <Textarea
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                placeholder="Tulis update progress penyelidikan..."
                className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            {success && <p className="text-green-400 text-xs">{success}</p>}
            <button
              onClick={handleProgress}
              disabled={loading}
              className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Send className="w-3 h-3 mr-1 inline" />}
              Update Progress
            </button>
          </div>
        )}

        {unitStatus && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1">Hasil Penyelidikan</p>
              <Textarea
                value={hasil}
                onChange={(e) => setHasil(e.target.value)}
                placeholder="Tulis hasil penyelidikan..."
                className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
                disabled={isDone}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1">Rekomendasi</p>
              <Select value={rekomendasi} onValueChange={(v) => setRekomendasi(v ?? "selesai")} disabled={isDone}>
                <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="selesai">Selesai</SelectItem>
                  <SelectItem value="limpah_provos">Limpah ke Provos</SelectItem>
                  <SelectItem value="limpah_wabprof">Limpah ke Wabprof</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            {success && <p className="text-green-400 text-xs">{success}</p>}
            {!isDone && (
              <button
                onClick={handleSelesai}
                disabled={loading}
                className="w-full bg-green-700 hover:bg-green-600 text-white h-8 text-xs rounded disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                Selesai Proses
              </button>
            )}
            {isDone && (
              <p className="text-xs text-green-400 text-center">Proses sudah selesai</p>
            )}
          </div>
        )}
      </div>
    </AksiCard>
  )
}
