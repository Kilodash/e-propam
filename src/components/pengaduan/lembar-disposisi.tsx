"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftRight, Loader2, Save, Send, Undo2 } from "lucide-react"
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
import ConfirmDialog from "@/components/ui/confirm-dialog"

interface UnitOption {
  gajamada_name: string
  normalized_name: string
  satker_level: string
  police_function: string | null
}

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
  const [satkerOptions, setSatkerOptions] = useState<UnitOption[]>([])
  const [saran, setSaran] = useState(initialSaran)
  const [telaah, setTelaah] = useState(initialTelaah)
  const [kelengkapan, setKelengkapan] = useState(initialKelengkapan)
  const [satker, setSatker] = useState(initialSatker)
  const [override, setOverride] = useState(false)
  const [overrideUnit, setOverrideUnit] = useState("")
  const [overrideAlasan, setOverrideAlasan] = useState("")
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [kembalikanAlasan, setKembalikanAlasan] = useState("")
  const [kembalikanLoading, setKembalikanLoading] = useState(false)
  const [kembalikanError, setKembalikanError] = useState<string | null>(null)
  const [confirmKembalikan, setConfirmKembalikan] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/units?disposition=true")
      .then(r => r.json())
      .then(json => setSatkerOptions(json.data ?? []))
      .catch(() => {})
  }, [])

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

  async function doKembalikan() {
    if (!kembalikanAlasan.trim()) {
      setKembalikanError("Alasan pengembalian wajib diisi")
      return
    }
    setKembalikanLoading(true)
    setKembalikanError(null)
    try {
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "kembalikan",
          pengaduanId,
          prepetratorId,
          alasan: kembalikanAlasan,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal mengembalikan")
      setKembalikanAlasan("")
      router.refresh()
      router.push("/dashboard/yanduan")
    } catch (e: any) {
      setKembalikanError(e.message)
    } finally {
      setKembalikanLoading(false)
    }
  }

  async function submit(thenAdvance: boolean, sendToKabid: boolean) {
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
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: sendToKabid ? "submit_kabid" : "saran",
          pengaduanId,
          prepetratorId,
          saran,
          telaah,
          kelengkapan,
          satkerTujuan: satker || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal menyimpan")

      setSuccess(sendToKabid ? "Disposisi dikirim ke Kabid" : "Saran tersimpan")
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
      <div className="bg-[#0F172A] rounded-lg border border-blue-500/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeftRight className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-gray-200">Lembar Disposisi</h3>
        </div>

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
              className="min-h-[80px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1.5">Satker/Satwil Tujuan</p>
            <Select value={satker} onValueChange={(v) => setSatker(v ?? "")}>
              <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
                <SelectValue placeholder="Pilih satker/satwil" />
              </SelectTrigger>
              <SelectContent>
                {satkerOptions.map((opt) => (
                  <SelectItem key={opt.gajamada_name} value={opt.gajamada_name}>{opt.normalized_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}

          <div className="flex gap-2">
            <Button
              onClick={() => submit(false, false)}
              disabled={loading}
              className="flex-1 bg-[#1E293B] hover:bg-[#334155] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Simpan
            </Button>
            <Button
              onClick={() => submit(true, true)}
              disabled={loading}
              className="flex-1 bg-[#0369A1] hover:bg-[#0284c7] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
              Kirim ke Kabid
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">✈</span>
            <span className="text-sm font-semibold text-yellow-400">Distribusi Langsung (Over-ride)</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={override}
            aria-label="Toggle distribusi langsung"
            onClick={() => setOverride(!override)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOverride(!override) }}}
            className={`w-10 h-5 rounded-full transition ${override ? "bg-[#0369A1]" : "bg-gray-600"}`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${override ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        {override && (
          <div className="space-y-3 pt-2 border-t border-yellow-700/50">
            <div>
              <p className="text-xs font-semibold text-yellow-400 mb-1">Unit Tujuan</p>
              <Select value={overrideUnit} onValueChange={(v) => setOverrideUnit(v ?? "")}>
                <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200">
                  <SelectValue placeholder="Pilih satker tujuan distribusi langsung" />
                </SelectTrigger>
                <SelectContent>
                  {satkerOptions.map((opt) => (
                    <SelectItem key={opt.gajamada_name} value={opt.gajamada_name}>{opt.normalized_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-semibold text-yellow-400 mb-1">Catatan Over-ride</p>
              <Textarea
                value={overrideAlasan}
                onChange={(e) => setOverrideAlasan(e.target.value)}
                placeholder="Alasan distribusi langsung ke unit..."
                className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
              />
            </div>
            {overrideError && <p className="text-red-400 text-xs">{overrideError}</p>}
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={overrideLoading}
              className="w-full bg-yellow-700 hover:bg-yellow-600 text-white"
            >
              {overrideLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <span>✈</span>}
              Distribusi Langsung
            </Button>
          </div>
        )}
      </div>

      <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Undo2 className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Kembalikan ke Mabes</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmKembalikan(true)}
            className="border-red-700 text-red-400 hover:bg-red-900/20"
          >
            Kembalikan
          </Button>
        </div>
      </div>

      {confirmKembalikan && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-gray-600 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white font-semibold mb-3">Kembalikan ke Mabes</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Alasan Pengembalian</p>
                <Textarea
                  value={kembalikanAlasan}
                  onChange={(e) => setKembalikanAlasan(e.target.value)}
                  placeholder="Jelaskan alasan laporan dikembalikan ke Divpropam Polri..."
                  className="min-h-[80px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
                  rows={3}
                />
              </div>
              {kembalikanError && <p className="text-red-400 text-xs">{kembalikanError}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setConfirmKembalikan(false); setKembalikanAlasan(""); setKembalikanError(null) }}
                  className="text-gray-300 border-gray-600"
                >
                  Batal
                </Button>
                <Button
                  onClick={doKembalikan}
                  disabled={kembalikanLoading || !kembalikanAlasan.trim()}
                  className="bg-red-700 hover:bg-red-600 text-white"
                >
                  {kembalikanLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Kembalikan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0F172A] rounded-lg border border-gray-700 p-3 flex items-center justify-between text-sm">
        <Link
          href={prevId ? `/dashboard/disposisi/${prevId}` : "#"}
          aria-label="Lembar disposisi sebelumnya"
          className={`flex items-center gap-1 ${prevId ? "text-gray-300 hover:text-blue-400" : "text-gray-600 pointer-events-none"}`}
        >
          ← Prev
        </Link>
        <span className="text-gray-400">{position} / {total}</span>
        <button
          onClick={() => {
            reset()
            setSuccess(null)
            setError(null)
          }}
          className="text-gray-300 hover:text-blue-400"
          aria-label="Reset form disposisi"
        >
          Reset
        </button>
        <Link
          href={nextId ? `/dashboard/disposisi/${nextId}` : "#"}
          aria-label="Lembar disposisi selanjutnya"
          className={`flex items-center gap-1 ${nextId ? "text-gray-300 hover:text-blue-400" : "text-gray-600 pointer-events-none"}`}
        >
          Next →
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Distribusi Langsung"
        message="Pengaduan akan didistribusikan langsung ke unit yang dipilih, melewati alur normal. Lanjutkan?"
        confirmLabel="Distribusi Langsung"
        variant="danger"
        loading={overrideLoading}
        onConfirm={() => { setConfirmOpen(false); doOverride() }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
