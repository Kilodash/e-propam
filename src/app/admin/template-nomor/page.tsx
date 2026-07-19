"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DOC_TEMPLATES } from "@/lib/template-nomor"

const DOC_LABELS: Record<string, string> = {
  lapinfo: "Laporan Informasi",
  lp_a: "LP-A",
  sprinlidik: "Sprin Lidik",
  uuk: "UUK",
  pemberitahuan_awal: "Pemberitahuan Awal",
  renbut: "Renbut Anggaran",
  ba_interogasi: "BA Interogasi",
  und_klarifikasi: "Undangan Klarifikasi",
  lhp: "LHP",
  nota_dinas: "Nota Dinas",
  notulen_gelar: "Notulen Gelar",
  pem_pelapor: "Pemberitahuan ke Pelapor",
  pem_ankum: "Pemberitahuan ke Ankum",
  surat: "Surat Pelimpahan",
  sprin_henti: "Sprin Henti Lidik",
  str_jukrah: "STR Jukrah",
  sp2hp2: "SP2HP2",
}

const PLACEHOLDERS = "{no} = nomor urut, {rom} = bulan romawi, {thn} = tahun, {unit} = nama unit"

export default function TemplateNomorPage() {
  const [templates, setTemplates] = useState<Record<string, string>>({ ...DOC_TEMPLATES })
  const [savedAll, setSavedAll] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(json => {
        const row = (json.data ?? []).find((r: any) => r.key === "doc_templates")
        if (row?.value) {
          try {
            setTemplates(prev => ({ ...prev, ...row.value }))
          } catch {}
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function simpanSemua() {
    setSavingAll(true)
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "doc_templates", value: templates }),
    })
    setSavingAll(false)
    setSavedAll(true)
    setTimeout(() => setSavedAll(false), 2000)
  }

  function reset(docType: string) {
    setTemplates(p => ({ ...p, [docType]: DOC_TEMPLATES[docType] ?? "" }))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  return (
    <div className="max-w-3xl pb-12">
      <div className="mb-6 flex items-center justify-between sticky top-0 bg-[#0F172A] z-10 py-4 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white">Template Nomor Dokumen</h2>
          <p className="text-xs text-gray-500 mt-1">{PLACEHOLDERS}</p>
        </div>
        <button
          onClick={simpanSemua}
          disabled={savingAll}
          className="flex items-center gap-2 px-4 py-2 bg-[#0369A1] hover:bg-[#0284c7] text-white rounded font-medium disabled:opacity-50"
        >
          {savingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {savedAll ? "Tersimpan" : "Simpan Semua"}
        </button>
      </div>

      <div className="space-y-3">
        {Object.keys(DOC_LABELS).map(docType => (
          <div key={docType} className="bg-[#0F172A] border border-gray-700 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-gray-300 mb-2">
              {DOC_LABELS[docType]}
              <span className="ml-2 text-gray-600 font-mono text-[10px]">{docType}</span>
            </p>
            <div className="flex gap-2 items-center">
              <Input
                value={templates[docType] ?? ""}
                onChange={e => setTemplates(p => ({ ...p, [docType]: e.target.value }))}
                className="flex-1 h-8 text-xs font-mono bg-[#1E293B] border-gray-600 text-gray-200"
                placeholder={`{no}/{rom}/{thn}/{unit}`}
              />
              <button
                onClick={() => reset(docType)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 border border-gray-600 text-gray-400 hover:text-white rounded"
                title="Reset ke default"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1 font-mono">
              Default: {DOC_TEMPLATES[docType] ?? "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
