"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Undo2, MessageSquare, Loader2 } from "lucide-react"

interface Props {
  pengaduanId: string
  prepetratorId: string
  currentSaran?: string | null
  unitOptions: string[]
}

type ModalKind = null | "override" | "kembalikan" | "saran"

export default function AksiYanduan({ pengaduanId, prepetratorId, currentSaran, unitOptions }: Props) {
  const [open, setOpen] = useState<ModalKind>(null)
  const [targetUnit, setTargetUnit] = useState("")
  const [alasan, setAlasan] = useState("")
  const [saran, setSaran] = useState(currentSaran ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function submit() {
    if (!open) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/aksi-yanduan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          open === "override" ? { action: "override", pengaduanId, prepetratorId, targetUnit, alasan } :
          open === "kembalikan" ? { action: "kembalikan", pengaduanId, prepetratorId, alasan } :
          { action: "saran", pengaduanId, saran }
        ),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || "Gagal")
      router.refresh()
      setOpen(null)
      setAlasan("")
      setTargetUnit("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function close() {
    setOpen(null)
    setError(null)
    setAlasan("")
    setTargetUnit("")
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Aksi Yanduan</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button onClick={() => setOpen("override")} className="bg-orange-600 hover:bg-orange-700 text-white">
          <AlertTriangle className="w-4 h-4 mr-1" /> Override Distribusi
        </Button>
        <Button onClick={() => setOpen("kembalikan")} className="bg-red-600 hover:bg-red-700 text-white">
          <Undo2 className="w-4 h-4 mr-1" /> Kembalikan ke Mabes
        </Button>
        <Button onClick={() => setOpen("saran")} className="bg-blue-700 hover:bg-blue-800 text-white">
          <MessageSquare className="w-4 h-4 mr-1" /> Saran ke Kabid
        </Button>
      </div>

      {(currentSaran || saran) && (
        <div className="bg-[#0F172A] border border-blue-700 rounded p-3 text-sm">
          <p className="text-blue-400 font-semibold mb-1">Saran ke Kabid:</p>
          <p className="text-gray-200 whitespace-pre-wrap">{currentSaran || saran}</p>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-gray-600 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-white font-semibold mb-3">
              {open === "override" && "Override Distribusi"}
              {open === "kembalikan" && "Pengembalian ke Mabes"}
              {open === "saran" && "Saran ke Kabid"}
            </h3>

            {open === "override" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300 text-xs">Unit Tujuan</Label>
                  <Select value={targetUnit} onValueChange={(v) => setTargetUnit(v ?? "")}>
                    <SelectTrigger className="bg-[#1e293b] border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300 text-xs">Alasan Override</Label>
                  <Textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder="Alasan Yanduan melakukan override distribusi..."
                    className="bg-[#1e293b] border-gray-600 text-white mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {open === "kembalikan" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300 text-xs">Alasan Pengembalian</Label>
                  <Textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder="Alasan laporan dikembalikan ke Divpropam Polri..."
                    className="bg-[#1e293b] border-gray-600 text-white mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {open === "saran" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-300 text-xs">Saran untuk Kabid</Label>
                  <Textarea
                    value={saran}
                    onChange={(e) => setSaran(e.target.value)}
                    placeholder="Saran/rekomendasi untuk Kabid Propam..."
                    className="bg-[#1e293b] border-gray-600 text-white mt-1"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 text-red-400 text-xs">{error}</div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={close} disabled={loading} className="text-white border-gray-600">
                Batal
              </Button>
              <Button onClick={submit} disabled={loading} className="bg-[#0369A1] hover:bg-[#0284c7] text-white">
                {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
