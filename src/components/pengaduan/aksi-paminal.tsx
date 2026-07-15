"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Play, Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocEntryList, type DocEntry } from "./doc-template-input"
import AksiCard from "./aksi-card"
import type { AksiCardRenderProps } from "@/lib/aksi-cards/types"

const STAGES = [
  { value: "perencanaan", label: "Perencanaan" },
  { value: "pengumpulan", label: "Pengumpulan Baket" },
  { value: "pengolahan", label: "Pengolahan" },
  { value: "pelaporan", label: "Pelaporan" },
]

const STAGE_DOC_TYPES: Record<string, { value: string; label: string }[]> = {
  perencanaan: [
    { value: "sprinlidik", label: "Sprinlidik" },
    { value: "uuk", label: "UUK" },
  ],
  pengumpulan: [
    { value: "ba_interogasi", label: "BA Interogasi" },
    { value: "und_klarifikasi", label: "Und. Klarifikasi" },
  ],
  pengolahan: [
    { value: "notulen_gelar", label: "Notulen Gelar" },
  ],
  pelaporan: [
    { value: "lhp", label: "LHP" },
    { value: "nota_dinas", label: "Nota Dinas" },
  ],
}

const TINDAK_LANJUT = [
  { key: "pem_pelapor", label: "Pemberitahuan ke Pelapor" },
  { key: "pem_ankum", label: "Pemberitahuan ke Ankum" },
]

export default function AksiPaminal({
  pengaduanId,
  prepetratorId,
  pengaduan,
  config,
}: AksiCardRenderProps) {
  const unitStatus = pengaduan.unit_status
  const currentPosition = pengaduan.case_position
  const isDone = unitStatus === "selesai"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [stage, setStage] = useState("perencanaan")
  const [catatan, setCatatan] = useState("")
  const [docEntries, setDocEntries] = useState<DocEntry[]>([
    { key: crypto.randomUUID(), doc_type: "", nomor_urut: "", bulan: new Date().getMonth() + 1, tahun: new Date().getFullYear() },
  ])

  const [hasil, setHasil] = useState("")
  const [pelimpahan, setPelimpahan] = useState("")
  const [pelanggarNama, setPelanggarNama] = useState("")
  const [pelanggarNrp, setPelanggarNrp] = useState("")
  const [pelanggarJabatan, setPelanggarJabatan] = useState("")
  const [kategoriPelanggaran, setKategoriPelanggaran] = useState("")
  const [wujudPerbuatan, setWujudPerbuatan] = useState("")
  const [pasalDilanggar, setPasalDilanggar] = useState("")
  const [tlList, setTlList] = useState<{ key: string; label: string; checked: boolean; nomor: string }[]>(
    TINDAK_LANJUT.map(tl => ({ ...tl, checked: false, nomor: "" }))
  )

  const router = useRouter()

  const title = (config?.title as string) ?? "Proses Paminal"
  const docTypes = STAGE_DOC_TYPES[stage] ?? []

  function toggleTl(idx: number) {
    const next = [...tlList]
    next[idx].checked = !next[idx].checked
    setTlList(next)
  }

  function setTlNomor(idx: number, nomor: string) {
    const next = [...tlList]
    next[idx].nomor = nomor
    setTlList(next)
  }

  async function handleStageUpdate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: stage === "pelaporan" ? "pelaporan" : "update_stage",
          pengaduanId,
          prepetratorId,
          currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
          stage,
          catatan,
          dokumen: docEntries.filter(d => d.doc_type),
          hasil: stage === "pelaporan" ? hasil : undefined,
          terbukti: stage === "pelaporan" ? hasil === "terbukti" : undefined,
          pelimpahan: stage === "pelaporan" && hasil === "terbukti" ? pelimpahan : undefined,
          pelanggar_nama: stage === "pelaporan" && hasil === "terbukti" ? pelanggarNama : undefined,
          pelanggar_nrp: stage === "pelaporan" && hasil === "terbukti" ? pelanggarNrp : undefined,
          pelanggar_jabatan: stage === "pelaporan" && hasil === "terbukti" ? pelanggarJabatan : undefined,
          kategori_pelanggaran: stage === "pelaporan" && hasil === "terbukti" ? kategoriPelanggaran : undefined,
          wujud_perbuatan: stage === "pelaporan" && hasil === "terbukti" ? wujudPerbuatan : undefined,
          pasal_dilanggar: stage === "pelaporan" && hasil === "terbukti" ? pasalDilanggar : undefined,
          tindak_lanjut: stage === "pelaporan" ? tlList : undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(json.message)
      setCatatan("")
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleMulai() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/unit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mulai",
          pengaduanId,
          prepetratorId,
          currentPosition: currentPosition || "KASUBBID PAMINAL POLDA JAWA BARAT",
        }),
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

  return (
    <AksiCard title={title} variant="default">
      <div className="space-y-3">
        {!unitStatus && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Mulai proses penyelidikan Paminal.</p>
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

        {unitStatus === "dalam_proses" && !isDone && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Tahap</p>
              <Select value={stage} onValueChange={(v) => setStage(v ?? "perencanaan")}>
                <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Catatan Progress</p>
              <Textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tulis catatan progress..."
                className="min-h-[60px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">Dokumen</p>
              <DocEntryList
                entries={docEntries}
                onChange={setDocEntries}
                docTypes={docTypes}
                unit="Subbid Paminal"
                pengaduanId={pengaduanId}
              />
            </div>

            {stage === "pelaporan" && (
              <div className="space-y-2 border-t border-gray-600 pt-2">
                <div>
                  <p className="text-xs font-semibold text-green-400 mb-1">Hasil Akhir</p>
                  <Select value={hasil} onValueChange={(v) => { setHasil(v ?? ""); if (v !== "terbukti") setPelimpahan("") }}>
                    <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                      <SelectValue placeholder="Pilih hasil..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tidak_terbukti">Tidak Terbukti</SelectItem>
                      <SelectItem value="terbukti">Terbukti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-1">Tindak Lanjut Wajib</p>
                  {tlList.map((tl, idx) => (
                    <div key={tl.key} className="flex items-center gap-2 mb-1">
                      <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tl.checked}
                          onChange={() => toggleTl(idx)}
                          className="w-3 h-3 rounded border-gray-500 bg-[#1E293B]"
                        />
                        {tl.label}
                      </label>
                      {tl.checked && (
                        <input
                          type="text"
                          value={tl.nomor}
                          onChange={(e) => setTlNomor(idx, e.target.value)}
                          placeholder="No"
                          className="w-16 text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1 h-6"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {hasil === "terbukti" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-yellow-400 mb-1">Identitas Pelanggar</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <p className="text-[10px] text-gray-500">Nama</p>
                        <input type="text" value={pelanggarNama} onChange={(e) => setPelanggarNama(e.target.value)}
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">NRP</p>
                        <input type="text" value={pelanggarNrp} onChange={(e) => setPelanggarNrp(e.target.value)}
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Jabatan</p>
                        <input type="text" value={pelanggarJabatan} onChange={(e) => setPelanggarJabatan(e.target.value)}
                          className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Kategori Pelanggaran</p>
                      <Select value={kategoriPelanggaran} onValueChange={(v) => setKategoriPelanggaran(v ?? "")}>
                        <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disiplin">Pelanggaran Disiplin</SelectItem>
                          <SelectItem value="kode_etik">Pelanggaran Kode Etik (KEPP)</SelectItem>
                          <SelectItem value="pidana">Tindak Pidana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Wujud Perbuatan</p>
                      <Textarea
                        value={wujudPerbuatan}
                        onChange={(e) => setWujudPerbuatan(e.target.value)}
                        placeholder="Uraian wujud perbuatan..."
                        className="min-h-[50px] text-sm bg-[#1E293B] border-gray-600 text-gray-200 placeholder:text-gray-500"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Pasal yang Dilanggar</p>
                      <input type="text" value={pasalDilanggar} onChange={(e) => setPasalDilanggar(e.target.value)}
                        className="w-full text-xs bg-[#1E293B] border border-gray-600 text-gray-200 rounded px-1.5 h-7"
                        placeholder="Contoh: Pasal 7 PP No.2 Tahun 2003" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-yellow-400 mb-1">Pelimpahan ke</p>
                      <Select value={pelimpahan} onValueChange={(v) => setPelimpahan(v ?? "")}>
                        <SelectTrigger className="w-full text-sm bg-[#1E293B] border-gray-600 text-gray-200 h-8">
                          <SelectValue placeholder="Pilih unit tujuan..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="provos">Subbid Provos</SelectItem>
                          <SelectItem value="wabprof">Subbid Wabprof</SelectItem>
                          <SelectItem value="polres">Polres</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-red-400 text-xs">{error}</p>}
            {success && <p className="text-green-400 text-xs">{success}</p>}

            <button
              onClick={handleStageUpdate}
              disabled={loading}
              className="w-full bg-[#0369A1] hover:bg-[#0284c7] text-white h-8 text-xs rounded disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> : <Send className="w-3 h-3 mr-1 inline" />}
              {stage === "pelaporan" ? "Selesai & Kirim" : "Update Progress"}
            </button>
          </div>
        )}

        {isDone && (
          <div className="space-y-2">
            <p className="text-xs text-green-400 text-center">Proses sudah selesai</p>
            {pengaduan.unit_progress && (
              <p className="text-xs text-gray-400 text-center">{pengaduan.unit_progress}</p>
            )}
          </div>
        )}
      </div>
    </AksiCard>
  )
}
