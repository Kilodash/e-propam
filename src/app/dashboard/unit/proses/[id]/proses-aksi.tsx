"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Send, CheckCircle2, Loader2 } from "lucide-react"

interface Props {
  pengaduanId: string
  prepetratorId: string
  currentPosition: string
  unitStatus: string | null
}

const STATUS_OPTIONS = [
  { value: "Lidik", label: "Lidik" },
  { value: "Proses Lidik", label: "Proses Lidik" },
  { value: "Gelar Lidik", label: "Gelar Lidik" },
  { value: "Gelar Perkara", label: "Gelar Perkara" },
]

export default function ProsesAksi({ pengaduanId, prepetratorId, currentPosition, unitStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [progress, setProgress] = useState("")
  const [nextStatus, setNextStatus] = useState("Proses Lidik")
  const [hasil, setHasil] = useState("")
  const [rekomendasi, setRekomendasi] = useState("selesai")
  const router = useRouter()

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

  const isDone = unitStatus === "selesai"

  return (
    <div className="space-y-4">
      {!unitStatus && (
        <div className="bg-[#0F172A] rounded-lg border border-gray-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">Mulai Proses</h3>
          <p className="text-xs text-gray-400">Tandai pengaduan ini sebagai diproses dan mulai penyelidikan.</p>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <Button
            onClick={handleMulai}
            disabled={loading}
            className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
            Mulai Proses
          </Button>
        </div>
      )}

      {unitStatus === "dalam_proses" && (
        <div className="bg-[#0F172A] rounded-lg border border-gray-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-200">Update Progress</h3>

          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <Select value={nextStatus} onValueChange={(v) => setNextStatus(v ?? "Proses Lidik")}>
              <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Catatan Progress</p>
            <Textarea
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              placeholder="Tulis update progress penyelidikan..."
              className="min-h-[80px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          <Button
            onClick={handleProgress}
            disabled={loading}
            className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Update Progress
          </Button>
        </div>
      )}

      {unitStatus && (
        <div className="bg-[#0F172A] rounded-lg border border-green-500/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-green-400">Selesai Proses</h3>

          <div>
            <p className="text-xs text-gray-400 mb-1">Hasil Penyelidikan</p>
            <Textarea
              value={hasil}
              onChange={(e) => setHasil(e.target.value)}
              placeholder="Tulis hasil penyelidikan..."
              className="min-h-[80px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
              disabled={isDone}
            />
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Rekomendasi</p>
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
            <Button
              onClick={handleSelesai}
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-600 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
              Selesai Proses
            </Button>
          )}

          {isDone && (
            <p className="text-xs text-green-400 text-center">Proses sudah selesai</p>
          )}
        </div>
      )}
    </div>
  )
}
